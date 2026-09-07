import { appointmentRepository } from './appointment.repository';
import { Appointment, AppointmentFilters, AppointmentStatus, CreateAppointmentInput } from './appointment.types';
import { doctorRepository } from '../doctors/doctor.repository';
import { doctorService } from '../doctors/doctor.service';
import { patientsService } from '../patients/patients.service';
import { journeyEventRepository } from '../journey/journeyEvent.repository';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.types';
import { ApiError } from '../../utils/ApiError';
import { generateSlots } from '../../utils/timeSlots';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

function getDayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function splitDateTime(scheduledAt: string): { date: string; time: string } {
  const isoLike = scheduledAt.includes('T') ? scheduledAt : scheduledAt.replace(' ', 'T');
  const [date, timePart] = isoLike.split('T');
  const time = timePart.slice(0, 5);
  return { date, time };
}

async function computeAvailableSlots(doctorId: number, date: string): Promise<TimeSlot[]> {
  const dayOfWeek = getDayOfWeek(date);
  const availabilityBlocks = await doctorRepository.getAvailabilityForDay(doctorId, dayOfWeek);
  if (availabilityBlocks.length === 0) {
    return [];
  }

  const bookedAppointments = await appointmentRepository.findByDoctorAndDate(doctorId, date);
  const bookedTimes = new Set(
    bookedAppointments.map((appointment) => splitDateTime(appointment.scheduledAt.toISOString()).time)
  );

  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const slots: TimeSlot[] = [];
  for (const block of availabilityBlocks) {
    const blockSlots = generateSlots(block.startTime.slice(0, 5), block.endTime.slice(0, 5), block.slotDurationMinutes);
    for (const slot of blockSlots) {
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      const slotMinutes = hours * 60 + minutes;
      const isPast = isToday && slotMinutes <= nowMinutes;
      slots.push({
        ...slot,
        available: !bookedTimes.has(slot.startTime) && !isPast,
      });
    }
  }

  return slots;
}

function assertScheduledAtIsValid(scheduledAt: string): void {
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest('Appointment date/time is invalid');
  }
  if (date.getTime() <= Date.now()) {
    throw ApiError.badRequest('Appointment date/time must be in the future');
  }
}

const CANCELLABLE_STATUSES = new Set([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]);

export const appointmentService = {
  async getAvailableSlots(doctorId: number, date: string): Promise<TimeSlot[]> {
    await doctorService.getDoctorById(doctorId);
    return computeAvailableSlots(doctorId, date);
  },

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const doctor = await doctorService.getDoctorById(input.doctorId);
    if (!doctor.isActive) {
      throw ApiError.badRequest('This doctor is not currently accepting appointments');
    }
    const patient = await patientsService.getPatientById(input.patientId);

    assertScheduledAtIsValid(input.scheduledAt);
    const { date, time } = splitDateTime(input.scheduledAt);

    const availableSlots = await computeAvailableSlots(input.doctorId, date);
    const matchedSlot = availableSlots.find((slot) => slot.startTime === time);

    if (!matchedSlot) {
      throw ApiError.badRequest('The selected appointment slot is not part of the doctor\'s schedule');
    }
    if (!matchedSlot.available) {
      throw ApiError.conflict('The selected appointment slot is no longer available');
    }

    const [startHour, startMinute] = matchedSlot.startTime.split(':').map(Number);
    const [endHour, endMinute] = matchedSlot.endTime.split(':').map(Number);
    const durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

    try {
      const appointment = await appointmentRepository.create({ ...input, durationMinutes });
      await journeyEventRepository.record(
        input.patientId,
        'APPOINTMENT_BOOKED',
        `Appointment booked for ${matchedSlot.startTime} on ${date}`,
        appointment.id
      );
      if (patient.userId) {
        await notificationService.notify(
          patient.userId,
          NotificationType.APPOINTMENT_CONFIRMATION,
          'Appointment Confirmed',
          `Your appointment with ${doctor.fullName} is booked for ${date} at ${matchedSlot.startTime}.`
        );
      }
      return appointment;
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'ER_DUP_ENTRY') {
        throw ApiError.conflict('The selected appointment slot is no longer available');
      }
      throw error;
    }
  },

  async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }
    return appointment;
  },

  async listAppointments(filters: AppointmentFilters): Promise<Appointment[]> {
    return appointmentRepository.findMany(filters);
  },

  async confirmAppointment(id: number): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw ApiError.badRequest('Only scheduled appointments can be confirmed');
    }
    const updated = await appointmentRepository.updateStatus(id, AppointmentStatus.CONFIRMED);
    return updated!;
  },

  async cancelAppointment(id: number): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);
    if (!CANCELLABLE_STATUSES.has(appointment.status)) {
      throw ApiError.badRequest(`An appointment with status ${appointment.status} cannot be cancelled`);
    }
    const updated = await appointmentRepository.updateStatus(id, AppointmentStatus.CANCELLED);
    await journeyEventRepository.record(appointment.patientId, 'APPOINTMENT_CANCELLED', 'Appointment cancelled', id);
    return updated!;
  },

  async markNoShow(id: number): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);
    if (!CANCELLABLE_STATUSES.has(appointment.status)) {
      throw ApiError.badRequest(`An appointment with status ${appointment.status} cannot be marked as no-show`);
    }
    const updated = await appointmentRepository.updateStatus(id, AppointmentStatus.NO_SHOW);
    return updated!;
  },

  async rescheduleAppointment(id: number, newScheduledAt: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);
    if (!CANCELLABLE_STATUSES.has(appointment.status)) {
      throw ApiError.badRequest(`An appointment with status ${appointment.status} cannot be rescheduled`);
    }

    assertScheduledAtIsValid(newScheduledAt);
    const { date, time } = splitDateTime(newScheduledAt);

    const availableSlots = await computeAvailableSlots(appointment.doctorId, date);
    const matchedSlot = availableSlots.find((slot) => slot.startTime === time);
    if (!matchedSlot || !matchedSlot.available) {
      throw ApiError.conflict('The selected appointment slot is not available');
    }

    const updated = await appointmentRepository.reschedule(id, newScheduledAt);
    await journeyEventRepository.record(
      appointment.patientId,
      'APPOINTMENT_RESCHEDULED',
      `Appointment rescheduled to ${matchedSlot.startTime} on ${date}`,
      id
    );
    return updated!;
  },

  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment> {
    const updated = await appointmentRepository.updateStatus(id, status);
    if (!updated) {
      throw ApiError.notFound('Appointment not found');
    }
    return updated;
  },
};
