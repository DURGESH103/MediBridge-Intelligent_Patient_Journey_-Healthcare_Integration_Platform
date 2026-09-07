import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { JourneyEvent, PatientJourney } from '@/types/domain';

export async function getMyCurrentJourney(): Promise<PatientJourney> {
  const res = await apiClient.get<ApiSuccess<PatientJourney>>('/journeys/me');
  return res.data.data;
}

export async function getCurrentJourneyForPatient(patientId: number): Promise<PatientJourney> {
  const res = await apiClient.get<ApiSuccess<PatientJourney>>(`/journeys/patients/${patientId}`);
  return res.data.data;
}

export async function getJourneyForAppointment(appointmentId: number): Promise<PatientJourney> {
  const res = await apiClient.get<ApiSuccess<PatientJourney>>(`/journeys/appointments/${appointmentId}`);
  return res.data.data;
}

export async function getPatientTimeline(patientId: number): Promise<JourneyEvent[]> {
  const res = await apiClient.get<ApiSuccess<JourneyEvent[]>>(`/journeys/patients/${patientId}/timeline`);
  return res.data.data;
}
