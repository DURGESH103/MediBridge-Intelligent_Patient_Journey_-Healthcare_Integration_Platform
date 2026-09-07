import { Request, Response } from 'express';
import { patientsService } from './patients.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';
import { Patient } from './patients.types';

function assertCanAccessPatient(req: Request, patient: Patient): void {
  if (req.user?.role === UserRole.PATIENT && patient.userId !== req.user.userId) {
    throw ApiError.forbidden('You can only access your own patient record');
  }
}

export const patientsController = {
  registerPatient: asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientsService.registerPatient(req.body);
    sendSuccess(res, 201, 'Patient registered successfully', patient);
  }),

  getPatientById: asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientsService.getPatientById(Number(req.params.id));
    assertCanAccessPatient(req, patient);
    sendSuccess(res, 200, 'Patient retrieved successfully', patient);
  }),

  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const patient = await patientsService.getPatientByUserId(req.user!.userId);
    sendSuccess(res, 200, 'Patient profile retrieved successfully', patient);
  }),

  updatePatient: asyncHandler(async (req: Request, res: Response) => {
    const existing = await patientsService.getPatientById(Number(req.params.id));
    assertCanAccessPatient(req, existing);
    const patient = await patientsService.updatePatient(Number(req.params.id), req.body);
    sendSuccess(res, 200, 'Patient updated successfully', patient);
  }),

  searchPatients: asyncHandler(async (req: Request, res: Response) => {
    const { q, page, pageSize } = req.query as unknown as {
      q: string;
      page: number;
      pageSize: number;
    };
    const patients = await patientsService.searchPatients(q, page, pageSize);
    sendSuccess(res, 200, 'Patients retrieved successfully', patients);
  }),
};
