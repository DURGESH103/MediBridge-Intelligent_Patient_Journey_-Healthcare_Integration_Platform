import { Request, Response } from 'express';
import { labService } from './lab.service';
import { patientsService } from '../patients/patients.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/roles';
import { LabTestRequest } from './lab.types';

async function assertCanAccessRequest(req: Request, request: LabTestRequest): Promise<void> {
  if (req.user?.role === UserRole.PATIENT) {
    const patient = await patientsService.getPatientByUserId(req.user.userId);
    if (request.patientId !== patient.id) {
      throw ApiError.forbidden('You can only access your own laboratory tests');
    }
  }
}

export const labController = {
  listPendingWork: asyncHandler(async (_req: Request, res: Response) => {
    const requests = await labService.listPendingWork();
    sendSuccess(res, 200, 'Pending laboratory work retrieved successfully', requests);
  }),

  getRequestById: asyncHandler(async (req: Request, res: Response) => {
    const request = await labService.getRequestById(Number(req.params.id));
    await assertCanAccessRequest(req, request);
    sendSuccess(res, 200, 'Laboratory test request retrieved successfully', request);
  }),

  listForPatient: asyncHandler(async (req: Request, res: Response) => {
    const patientId = Number(req.params.patientId);
    if (req.user!.role === UserRole.PATIENT) {
      const patient = await patientsService.getPatientByUserId(req.user!.userId);
      if (patient.id !== patientId) {
        throw ApiError.forbidden('You can only access your own laboratory tests');
      }
    }
    const requests = await labService.listForPatient(patientId);
    sendSuccess(res, 200, 'Laboratory tests retrieved successfully', requests);
  }),

  collectSample: asyncHandler(async (req: Request, res: Response) => {
    const request = await labService.collectSample(Number(req.params.id));
    sendSuccess(res, 200, 'Sample collected successfully', request);
  }),

  startProcessing: asyncHandler(async (req: Request, res: Response) => {
    const request = await labService.startProcessing(Number(req.params.id));
    sendSuccess(res, 200, 'Test processing started', request);
  }),

  completeTest: asyncHandler(async (req: Request, res: Response) => {
    const result = await labService.completeTest(
      Number(req.params.id),
      req.body.resultSummary,
      req.body.reportFileUrl
    );
    sendSuccess(res, 200, 'Laboratory test completed successfully', result);
  }),

  getReport: asyncHandler(async (req: Request, res: Response) => {
    const request = await labService.getRequestById(Number(req.params.id));
    await assertCanAccessRequest(req, request);
    const report = await labService.getReport(Number(req.params.id));
    sendSuccess(res, 200, 'Laboratory report retrieved successfully', report);
  }),
};
