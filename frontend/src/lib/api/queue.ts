import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { QueueEntry, QueueStatusSummary } from '@/types/domain';

export async function checkIn(appointmentId: number): Promise<QueueEntry> {
  const res = await apiClient.post<ApiSuccess<QueueEntry>>('/queue/check-in', { appointmentId });
  return res.data.data;
}

export async function getDoctorQueue(doctorId: number): Promise<QueueEntry[]> {
  const res = await apiClient.get<ApiSuccess<QueueEntry[]>>(`/queue/doctors/${doctorId}`);
  return res.data.data;
}

export async function getDoctorQueueSummary(doctorId: number): Promise<QueueStatusSummary> {
  const res = await apiClient.get<ApiSuccess<QueueStatusSummary>>(`/queue/doctors/${doctorId}/summary`);
  return res.data.data;
}

export async function callNextPatient(doctorId: number): Promise<QueueEntry> {
  const res = await apiClient.patch<ApiSuccess<QueueEntry>>(`/queue/doctors/${doctorId}/call-next`);
  return res.data.data;
}

export async function getQueueEntryStatus(entryId: number): Promise<QueueStatusSummary> {
  const res = await apiClient.get<ApiSuccess<QueueStatusSummary>>(`/queue/entries/${entryId}`);
  return res.data.data;
}

export async function completeQueueEntry(entryId: number): Promise<QueueEntry> {
  const res = await apiClient.patch<ApiSuccess<QueueEntry>>(`/queue/entries/${entryId}/complete`);
  return res.data.data;
}

export async function skipQueueEntry(entryId: number): Promise<QueueEntry> {
  const res = await apiClient.patch<ApiSuccess<QueueEntry>>(`/queue/entries/${entryId}/skip`);
  return res.data.data;
}

export async function cancelQueueEntry(entryId: number): Promise<QueueEntry> {
  const res = await apiClient.patch<ApiSuccess<QueueEntry>>(`/queue/entries/${entryId}/cancel`);
  return res.data.data;
}
