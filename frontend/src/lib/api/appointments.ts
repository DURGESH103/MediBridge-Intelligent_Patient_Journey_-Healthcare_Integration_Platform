import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { Appointment, AppointmentStatus, TimeSlot } from '@/types/domain';

export async function getAvailableSlots(doctorId: number, date: string): Promise<TimeSlot[]> {
  const res = await apiClient.get<ApiSuccess<TimeSlot[]>>('/appointments/available-slots', {
    params: { doctorId, date },
  });
  return res.data.data;
}

export interface CreateAppointmentPayload {
  doctorId: number;
  scheduledAt: string;
  reason?: string | null;
  patientId?: number;
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const res = await apiClient.post<ApiSuccess<Appointment>>('/appointments', payload);
  return res.data.data;
}

export interface ListAppointmentsFilters {
  patientId?: number;
  doctorId?: number;
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
}

export async function listAppointments(filters: ListAppointmentsFilters = {}): Promise<Appointment[]> {
  const res = await apiClient.get<ApiSuccess<Appointment[]>>('/appointments', { params: filters });
  return res.data.data;
}

export async function getAppointmentById(id: number): Promise<Appointment> {
  const res = await apiClient.get<ApiSuccess<Appointment>>(`/appointments/${id}`);
  return res.data.data;
}

export async function confirmAppointment(id: number): Promise<Appointment> {
  const res = await apiClient.patch<ApiSuccess<Appointment>>(`/appointments/${id}/confirm`);
  return res.data.data;
}

export async function cancelAppointment(id: number): Promise<Appointment> {
  const res = await apiClient.patch<ApiSuccess<Appointment>>(`/appointments/${id}/cancel`);
  return res.data.data;
}

export async function markNoShow(id: number): Promise<Appointment> {
  const res = await apiClient.patch<ApiSuccess<Appointment>>(`/appointments/${id}/no-show`);
  return res.data.data;
}

export async function rescheduleAppointment(id: number, scheduledAt: string): Promise<Appointment> {
  const res = await apiClient.patch<ApiSuccess<Appointment>>(`/appointments/${id}/reschedule`, { scheduledAt });
  return res.data.data;
}
