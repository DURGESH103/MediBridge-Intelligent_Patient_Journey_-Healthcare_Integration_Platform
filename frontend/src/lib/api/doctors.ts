import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { Department, Doctor, DoctorAvailability } from '@/types/domain';

export async function listDepartments(): Promise<Department[]> {
  const res = await apiClient.get<ApiSuccess<Department[]>>('/departments');
  return res.data.data;
}

export async function createDepartment(payload: { name: string; description?: string | null }): Promise<Department> {
  const res = await apiClient.post<ApiSuccess<Department>>('/departments', payload);
  return res.data.data;
}

export async function listDoctors(departmentId?: number): Promise<Doctor[]> {
  const res = await apiClient.get<ApiSuccess<Doctor[]>>('/doctors', { params: { departmentId } });
  return res.data.data;
}

export async function getDoctorById(id: number): Promise<Doctor> {
  const res = await apiClient.get<ApiSuccess<Doctor>>(`/doctors/${id}`);
  return res.data.data;
}

export async function getMyDoctorProfile(): Promise<Doctor> {
  const res = await apiClient.get<ApiSuccess<Doctor>>('/doctors/me');
  return res.data.data;
}

export interface RegisterDoctorPayload {
  email: string;
  password: string;
  departmentId: number;
  fullName: string;
  specialization: string;
  qualification?: string | null;
  phone?: string | null;
  consultationFee?: number | null;
  averageConsultationMinutes?: number;
}

export async function registerDoctor(payload: RegisterDoctorPayload): Promise<{ doctor: Doctor }> {
  const res = await apiClient.post<ApiSuccess<{ doctor: Doctor }>>('/doctors', payload);
  return res.data.data;
}

export async function getDoctorAvailability(doctorId: number): Promise<DoctorAvailability[]> {
  const res = await apiClient.get<ApiSuccess<DoctorAvailability[]>>(`/doctors/${doctorId}/availability`);
  return res.data.data;
}

export interface AvailabilitySlotInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export async function setDoctorAvailability(
  doctorId: number,
  slots: AvailabilitySlotInput[]
): Promise<DoctorAvailability[]> {
  const res = await apiClient.put<ApiSuccess<DoctorAvailability[]>>(`/doctors/${doctorId}/availability`, { slots });
  return res.data.data;
}
