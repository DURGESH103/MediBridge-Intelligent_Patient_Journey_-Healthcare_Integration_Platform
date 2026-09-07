import { Request, Response } from 'express';
import { billingService } from './billing.service';
import { patientsService } from '../patients/patients.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';

export const billingController = {
  listPending: asyncHandler(async (_req: Request, res: Response) => {
    const records = await billingService.listPending();
    sendSuccess(res, 200, 'Pending billing records retrieved successfully', records);
  }),

  listCompleted: asyncHandler(async (_req: Request, res: Response) => {
    const records = await billingService.listCompleted();
    sendSuccess(res, 200, 'Completed billing records retrieved successfully', records);
  }),

  listForPatient: asyncHandler(async (req: Request, res: Response) => {
    const patientId = Number(req.params.patientId);
    if (req.user!.role === UserRole.PATIENT) {
      const patient = await patientsService.getPatientByUserId(req.user!.userId);
      if (patient.id !== patientId) {
        throw ApiError.forbidden('You can only access your own billing records');
      }
    }
    const records = await billingService.listForPatient(patientId);
    sendSuccess(res, 200, 'Billing records retrieved successfully', records);
  }),

  markPaid: asyncHandler(async (req: Request, res: Response) => {
    const record = await billingService.markPaid(Number(req.params.id));
    sendSuccess(res, 200, 'Billing record marked as paid', record);
  }),
};
