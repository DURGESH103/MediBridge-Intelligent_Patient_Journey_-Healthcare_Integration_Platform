import { tryGetSocketServer } from './index';
import { LabReport, LabTestRequest } from '../modules/laboratory/lab.types';

export function emitLabReportReady(patientId: number, request: LabTestRequest, report: LabReport): void {
  tryGetSocketServer()?.to(`patient:${patientId}`).emit('lab:report-ready', { request, report });
}
