import { consultationRepository } from './consultation.repository';
import { Consultation, ConsultationStatus, CreatePrescriptionInput, NextStep, Prescription } from './consultation.types';
import { appointmentService } from '../appointments/appointment.service';
import { AppointmentStatus } from '../appointments/appointment.types';
import { labRepository } from '../laboratory/lab.repository';
import { queueRepository } from '../queue/queue.repository';
import { queueService } from '../queue/queue.service';
import { QueueStatus } from '../queue/queue.types';
import { journeyEventRepository } from '../journey/journeyEvent.repository';
import { doctorRepository } from '../doctors/doctor.repository';
import { billingService } from '../billing/billing.service';
import { ApiError } from '../../utils/ApiError';

export const consultationService = {
  async startConsultation(appointmentId: number): Promise<Consultation> {
    const appointment = await appointmentService.getAppointmentById(appointmentId);
    if (appointment.status !== AppointmentStatus.CHECKED_IN) {
      throw ApiError.badRequest('The patient must be checked in before starting a consultation');
    }

    const existing = await consultationRepository.findByAppointmentId(appointmentId);
    if (existing) {
      throw ApiError.conflict('A consultation has already been started for this appointment');
    }

    const consultation = await consultationRepository.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
    });
    await journeyEventRepository.record(
      appointment.patientId,
      'CONSULTATION_STARTED',
      'Consultation started',
      appointmentId
    );
    return consultation;
  },

  async getConsultationById(id: number): Promise<Consultation> {
    const consultation = await consultationRepository.findById(id);
    if (!consultation) {
      throw ApiError.notFound('Consultation not found');
    }
    return consultation;
  },

  async getByAppointmentId(appointmentId: number): Promise<Consultation> {
    const consultation = await consultationRepository.findByAppointmentId(appointmentId);
    if (!consultation) {
      throw ApiError.notFound('No consultation has been started for this appointment');
    }
    return consultation;
  },

  async listForPatient(patientId: number): Promise<Consultation[]> {
    return consultationRepository.findByPatient(patientId);
  },

  async updateNotes(id: number, diagnosis?: string | null, notes?: string | null): Promise<Consultation> {
    const consultation = await this.getConsultationById(id);
    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw ApiError.badRequest('Cannot edit a completed consultation');
    }
    const updated = await consultationRepository.updateNotes(id, diagnosis, notes);
    return updated!;
  },

  async addPrescription(consultationId: number, input: CreatePrescriptionInput): Promise<Prescription> {
    const consultation = await this.getConsultationById(consultationId);
    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw ApiError.badRequest('Cannot add a prescription to a completed consultation');
    }
    return consultationRepository.addPrescription(consultationId, input);
  },

  async getPrescriptions(consultationId: number): Promise<Prescription[]> {
    await this.getConsultationById(consultationId);
    return consultationRepository.getPrescriptions(consultationId);
  },

  async completeConsultation(id: number): Promise<{ consultation: Consultation; nextStep: NextStep }> {
    const consultation = await this.getConsultationById(id);
    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw ApiError.badRequest('This consultation has already been completed');
    }

    const updated = await consultationRepository.complete(id);
    await appointmentService.updateStatus(consultation.appointmentId, AppointmentStatus.COMPLETED);
    await journeyEventRepository.record(
      consultation.patientId,
      'CONSULTATION_COMPLETED',
      'Consultation completed',
      consultation.appointmentId
    );

    const queueEntry = await queueRepository.findByAppointmentId(consultation.appointmentId);
    if (queueEntry && queueEntry.status === QueueStatus.IN_PROGRESS) {
      await queueService.completeEntry(queueEntry.id);
    }

    const labRequests = await labRepository.findByConsultationId(id);
    const nextStep: NextStep = labRequests.length > 0 ? 'LABORATORY' : 'BILLING';

    // The consultation fee is billable as soon as the consultation itself is
    // done, independent of whether lab work still needs to happen - billing
    // and laboratory are parallel next steps, not sequential.
    const doctor = await doctorRepository.findById(consultation.doctorId);
    await billingService.createForConsultation({
      patientId: consultation.patientId,
      appointmentId: consultation.appointmentId,
      consultationId: consultation.id,
      amount: doctor?.consultationFee ?? null,
    });

    return { consultation: updated!, nextStep };
  },
};
