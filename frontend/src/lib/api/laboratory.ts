import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { LabReport, LabTestRequest } from '@/types/domain';

export async function listPendingLabWork(): Promise<LabTestRequest[]> {
  const res = await apiClient.get<ApiSuccess<LabTestRequest[]>>('/laboratory/pending');
  return res.data.data;
}

export async function listLabTestsForPatient(patientId: number): Promise<LabTestRequest[]> {
  const res = await apiClient.get<ApiSuccess<LabTestRequest[]>>(`/laboratory/patients/${patientId}`);
  return res.data.data;
}

export async function getLabTestRequest(id: number): Promise<LabTestRequest> {
  const res = await apiClient.get<ApiSuccess<LabTestRequest>>(`/laboratory/${id}`);
  return res.data.data;
}

export async function getLabReport(labTestRequestId: number): Promise<LabReport> {
  const res = await apiClient.get<ApiSuccess<LabReport>>(`/laboratory/${labTestRequestId}/report`);
  return res.data.data;
}

export async function collectSample(id: number): Promise<LabTestRequest> {
  const res = await apiClient.patch<ApiSuccess<LabTestRequest>>(`/laboratory/${id}/collect-sample`);
  return res.data.data;
}

export async function startProcessing(id: number): Promise<LabTestRequest> {
  const res = await apiClient.patch<ApiSuccess<LabTestRequest>>(`/laboratory/${id}/start-processing`);
  return res.data.data;
}

export async function completeLabTest(
  id: number,
  payload: { resultSummary: string; reportFileUrl?: string | null }
): Promise<{ request: LabTestRequest; report: LabReport }> {
  const res = await apiClient.patch<ApiSuccess<{ request: LabTestRequest; report: LabReport }>>(
    `/laboratory/${id}/complete`,
    payload
  );
  return res.data.data;
}
