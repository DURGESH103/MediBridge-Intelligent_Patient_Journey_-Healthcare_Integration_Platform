import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { Gender, Patient } from '@/types/domain';

export interface RegisterWalkInPatientPayload {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export type UpdatePatientPayload = Partial<RegisterWalkInPatientPayload>;

export async function getMyPatientProfile(): Promise<Patient> {
  const res = await apiClient.get<ApiSuccess<Patient>>('/patients/me');
  return res.data.data;
}

export async function getPatientById(id: number): Promise<Patient> {
  const res = await apiClient.get<ApiSuccess<Patient>>(`/patients/${id}`);
  return res.data.data;
}

export async function registerWalkInPatient(payload: RegisterWalkInPatientPayload): Promise<Patient> {
  const res = await apiClient.post<ApiSuccess<Patient>>('/patients', payload);
  return res.data.data;
}

export async function updatePatient(id: number, payload: UpdatePatientPayload): Promise<Patient> {
  const res = await apiClient.patch<ApiSuccess<Patient>>(`/patients/${id}`, payload);
  return res.data.data;
}

export async function searchPatients(query: string, page = 1, pageSize = 20): Promise<Patient[]> {
  const res = await apiClient.get<ApiSuccess<Patient[]>>('/patients/search', {
    params: { q: query, page, pageSize },
  });
  return res.data.data;
}

export async function getPatientCount(): Promise<number> {
  const res = await apiClient.get<ApiSuccess<{ count: number }>>('/patients/count');
  return res.data.data.count;
}
