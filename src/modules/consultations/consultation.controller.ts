import { Request, Response } from 'express';
import { consultationService } from './consultation.service';
import { labService } from '../laboratory/lab.service';
import { patientsService } from '../patients/patients.service';
import { doctorService } from '../doctors/doctor.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';
import { Consultation } from './consultation.types';

async function assertCanAccessConsultation(req: Request, consultation: Consultation): Promise<void> {
  if (req.user?.role === UserRole.PATIENT) {
    const patient = await patientsService.getPatientByUserId(req.user.userId);
    if (consultation.patientId !== patient.id) {
      throw ApiError.forbidden('You can only access your own consultations');
    }
  } else if (req.user?.role === UserRole.DOCTOR) {
    const doctor = await doctorService.getDoctorByUserId(req.user.userId);
    if (consultation.doctorId !== doctor.id) {
      throw ApiError.forbidden('You can only access your own consultations');
    }
  }
}

export const consultationController = {
  startConsultation: asyncHandler(async (req: Request, res: Response) => {
    const consultation = await consultationService.startConsultation(req.body.appointmentId);
    await assertCanAccessConsultation(req, consultation);
    sendSuccess(res, 201, 'Consultation started successfully', consultation);
  }),

  getConsultationById: asyncHandler(async (req: Request, res: Response) => {
    const consultation = await consultationService.getConsultationById(Number(req.params.id));
    await assertCanAccessConsultation(req, consultation);
    sendSuccess(res, 200, 'Consultation retrieved successfully', consultation);
  }),

  getByAppointment: asyncHandler(async (req: Request, res: Response) => {
    const consultation = await consultationService.getByAppointmentId(Number(req.params.appointmentId));
    await assertCanAccessConsultation(req, consultation);
    sendSuccess(res, 200, 'Consultation retrieved successfully', consultation);
  }),

  updateNotes: asyncHandler(async (req: Request, res: Response) => {
    const existing = await consultationService.getConsultationById(Number(req.params.id));
    await assertCanAccessConsultation(req, existing);
    const consultation = await consultationService.updateNotes(
      Number(req.params.id),
      req.body.diagnosis,
      req.body.notes
    );
    sendSuccess(res, 200, 'Consultation updated successfully', consultation);
  }),

  addPrescription: asyncHandler(async (req: Request, res: Response) => {
    const existing = await consultationService.getConsultationById(Number(req.params.id));
    await assertCanAccessConsultation(req, existing);
    const prescription = await consultationService.addPrescription(Number(req.params.id), req.body);
    sendSuccess(res, 201, 'Prescription added successfully', prescription);
  }),

  getPrescriptions: asyncHandler(async (req: Request, res: Response) => {
    const existing = await consultationService.getConsultationById(Number(req.params.id));
    await assertCanAccessConsultation(req, existing);
    const prescriptions = await consultationService.getPrescriptions(Number(req.params.id));
    sendSuccess(res, 200, 'Prescriptions retrieved successfully', prescriptions);
  }),

  requestLabTest: asyncHandler(async (req: Request, res: Response) => {
    const existing = await consultationService.getConsultationById(Number(req.params.id));
    await assertCanAccessConsultation(req, existing);
    const request = await labService.requestTest(Number(req.params.id), req.body.testName);
    sendSuccess(res, 201, 'Laboratory test requested successfully', request);
  }),

  listLabTests: asyncHandler(async (req: Request, res: Response) => {
    const existing = await consultationService.getConsultationById(Number(req.params.id));
    await assertCanAccessConsultation(req, existing);
    const requests = await labService.listForConsultation(Number(req.params.id));
    sendSuccess(res, 200, 'Laboratory tests retrieved successfully', requests);
  }),

  completeConsultation: asyncHandler(async (req: Request, res: Response) => {
    const existing = await consultationService.getConsultationById(Number(req.params.id));
    await assertCanAccessConsultation(req, existing);
    const result = await consultationService.completeConsultation(Number(req.params.id));
    sendSuccess(res, 200, 'Consultation completed successfully', result);
  }),
};
