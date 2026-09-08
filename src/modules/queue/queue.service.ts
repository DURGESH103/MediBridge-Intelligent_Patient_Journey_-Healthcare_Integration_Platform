import { queueRepository } from './queue.repository';
import { nextTokenNumber } from './queue.redis';
import { QueueEntry, QueueStatus, QueueStatusSummary } from './queue.types';
import { appointmentService } from '../appointments/appointment.service';
import { AppointmentStatus } from '../appointments/appointment.types';
import { doctorService } from '../doctors/doctor.service';
import { journeyEventRepository } from '../journey/journeyEvent.repository';
import { patientsRepository } from '../patients/patients.repository';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.types';
import { ApiError } from '../../utils/ApiError';
import { todayDateString } from '../../utils/dateOnly';
import { emitPatientCalled, emitQueueUpdated } from '../../sockets/queueEvents';

const CHECK_IN_ELIGIBLE_STATUSES = new Set([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]);

async function broadcastQueue(doctorId: number, queueDate: string): Promise<void> {
  const entries = await queueRepository.findForDoctorAndDate(doctorId, queueDate);
  emitQueueUpdated(doctorId, entries);
}

export const queueService = {
  async checkIn(appointmentId: number): Promise<QueueEntry> {
    const appointment = await appointmentService.getAppointmentById(appointmentId);

    if (!CHECK_IN_ELIGIBLE_STATUSES.has(appointment.status)) {
      throw ApiError.badRequest(`An appointment with status ${appointment.status} cannot be checked in`);
    }

    const today = todayDateString();
    const appointmentDate = appointment.scheduledAt.toISOString().slice(0, 10);
    if (appointmentDate !== today) {
      throw ApiError.badRequest('Check-in is only allowed on the day of the appointment');
    }

    const existingEntry = await queueRepository.findByAppointmentId(appointmentId);
    if (existingEntry) {
      throw ApiError.conflict('This appointment has already been checked in');
    }

    const tokenNumber = await nextTokenNumber(appointment.doctorId, today);
    const entry = await queueRepository.create({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      queueDate: today,
      tokenNumber,
    });

    await appointmentService.updateStatus(appointmentId, AppointmentStatus.CHECKED_IN);
    await journeyEventRepository.record(
      appointment.patientId,
      'CHECKED_IN',
      `Checked in - token #${tokenNumber}`,
      appointmentId
    );
    await broadcastQueue(appointment.doctorId, today);

    const patient = await patientsRepository.findById(appointment.patientId);
    if (patient?.userId) {
      await notificationService.notify(
        patient.userId,
        NotificationType.QUEUE_UPDATE,
        'Checked In',
        `You are checked in. Your token number is ${tokenNumber}.`
      );
    }

    return entry;
  },

  async getQueueForDoctor(doctorId: number, queueDate: string = todayDateString()): Promise<QueueEntry[]> {
    return queueRepository.findForDoctorAndDate(doctorId, queueDate);
  },

  async getQueueSummary(doctorId: number, queueDate: string = todayDateString()): Promise<QueueStatusSummary> {
    const [currentlyServing, allEntries] = await Promise.all([
      queueRepository.findCurrentlyServing(doctorId, queueDate),
      queueRepository.findForDoctorAndDate(doctorId, queueDate),
    ]);

    const totalWaiting = allEntries.filter((entry) => entry.status === QueueStatus.WAITING).length;

    return {
      doctorId,
      queueDate,
      currentlyServingToken: currentlyServing?.tokenNumber ?? null,
      totalWaiting,
    };
  },

  async getStatusForQueueEntry(queueEntryId: number): Promise<QueueStatusSummary> {
    const entry = await queueRepository.findById(queueEntryId);
    if (!entry) {
      throw ApiError.notFound('Queue entry not found');
    }

    const summary = await this.getQueueSummary(entry.doctorId, entry.queueDate);
    const doctor = await doctorService.getDoctorById(entry.doctorId);
    const patientsAhead =
      entry.status === QueueStatus.WAITING
        ? await queueRepository.countWaitingAhead(entry.doctorId, entry.queueDate, entry.tokenNumber)
        : 0;

    return {
      ...summary,
      yourEntry: {
        tokenNumber: entry.tokenNumber,
        status: entry.status,
        patientsAhead,
        estimatedWaitMinutes: patientsAhead * doctor.averageConsultationMinutes,
      },
    };
  },

  async callNext(doctorId: number): Promise<QueueEntry> {
    const queueDate = todayDateString();
    const inProgress = await queueRepository.findCurrentlyServing(doctorId, queueDate);
    if (inProgress) {
      throw ApiError.conflict('Complete or skip the current patient before calling the next one');
    }

    const next = await queueRepository.findNextWaiting(doctorId, queueDate);
    if (!next) {
      throw ApiError.notFound('No patients are waiting in the queue');
    }

    return this.markInProgress(next);
  },

  /**
   * Directly claims a specific WAITING entry, bypassing callNext's "pick the
   * next one in line" / "no one else in progress" rules. Used when a doctor
   * starts a consultation straight from the Consultations list instead of
   * going through the queue board's Call Next button, so the queue entry
   * still reflects that this patient is now being seen.
   */
  async markInProgress(entry: QueueEntry): Promise<QueueEntry> {
    const updated = await queueRepository.updateStatus(entry.id, QueueStatus.IN_PROGRESS, { calledAt: new Date() });
    await broadcastQueue(entry.doctorId, entry.queueDate);
    emitPatientCalled(entry.doctorId, updated!);
    return updated!;
  },

  async completeEntry(queueEntryId: number): Promise<QueueEntry> {
    const entry = await this.requireEntry(queueEntryId);
    if (entry.status !== QueueStatus.IN_PROGRESS) {
      throw ApiError.badRequest('Only a patient currently in progress can be marked completed');
    }
    const updated = await queueRepository.updateStatus(entry.id, QueueStatus.COMPLETED, { completedAt: new Date() });
    await broadcastQueue(entry.doctorId, entry.queueDate);
    return updated!;
  },

  async skipEntry(queueEntryId: number): Promise<QueueEntry> {
    const entry = await this.requireEntry(queueEntryId);
    if (entry.status !== QueueStatus.IN_PROGRESS && entry.status !== QueueStatus.WAITING) {
      throw ApiError.badRequest(`An entry with status ${entry.status} cannot be skipped`);
    }
    const updated = await queueRepository.updateStatus(entry.id, QueueStatus.SKIPPED);
    await broadcastQueue(entry.doctorId, entry.queueDate);
    return updated!;
  },

  async cancelEntry(queueEntryId: number): Promise<QueueEntry> {
    const entry = await this.requireEntry(queueEntryId);
    if (entry.status !== QueueStatus.WAITING) {
      throw ApiError.badRequest('Only a waiting queue entry can be cancelled');
    }
    const updated = await queueRepository.updateStatus(entry.id, QueueStatus.CANCELLED);
    await broadcastQueue(entry.doctorId, entry.queueDate);
    return updated!;
  },

  async requireEntry(queueEntryId: number): Promise<QueueEntry> {
    const entry = await queueRepository.findById(queueEntryId);
    if (!entry) {
      throw ApiError.notFound('Queue entry not found');
    }
    return entry;
  },

  async getEntryByAppointmentId(appointmentId: number): Promise<QueueEntry> {
    const entry = await queueRepository.findByAppointmentId(appointmentId);
    if (!entry) {
      throw ApiError.notFound('No queue entry found for this appointment');
    }
    return entry;
  },
};
