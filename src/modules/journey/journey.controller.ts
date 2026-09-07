import { Request, Response } from 'express';
import { journeyService } from './journey.service';
import { patientsService } from '../patients/patients.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';
import { PatientJourney } from './journey.types';

// Staff roles (doctors, receptionists, lab staff, billing, admin) can view any
// patient's journey - only patients themselves are restricted to their own.
async function assertCanAccessJourney(req: Request, journey: PatientJourney): Promise<void> {
  if (req.user?.role === UserRole.PATIENT) {
    const patient = await patientsService.getPatientByUserId(req.user.userId);
    if (journey.patientId !== patient.id) {
      throw ApiError.forbidden('You can only access your own journey');
    }
  }
}

async function assertCanAccessPatient(req: Request, patientId: number): Promise<void> {
  if (req.user?.role === UserRole.PATIENT) {
    const patient = await patientsService.getPatientByUserId(req.user.userId);
    if (patient.id !== patientId) {
      throw ApiError.forbidden('You can only access your own journey');
    }
  }
}

export const journeyController = {
  getMyCurrentJourney: asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientsService.getPatientByUserId(req.user!.userId);
    const journey = await journeyService.getCurrentJourneyForPatient(patient.id);
    sendSuccess(res, 200, 'Journey retrieved successfully', journey);
  }),

  getCurrentJourneyForPatient: asyncHandler(async (req: Request, res: Response) => {
    const patientId = Number(req.params.patientId);
    await assertCanAccessPatient(req, patientId);
    const journey = await journeyService.getCurrentJourneyForPatient(patientId);
    sendSuccess(res, 200, 'Journey retrieved successfully', journey);
  }),

  getJourneyForAppointment: asyncHandler(async (req: Request, res: Response) => {
    const appointmentId = Number(req.params.appointmentId);
    const journey = await journeyService.getJourneyForAppointment(appointmentId);
    await assertCanAccessJourney(req, journey);
    sendSuccess(res, 200, 'Journey retrieved successfully', journey);
  }),

  getTimelineForPatient: asyncHandler(async (req: Request, res: Response) => {
    const patientId = Number(req.params.patientId);
    await assertCanAccessPatient(req, patientId);
    const timeline = await journeyService.getTimelineForPatient(patientId);
    sendSuccess(res, 200, 'Timeline retrieved successfully', timeline);
  }),
};
