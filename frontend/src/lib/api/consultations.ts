import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { Consultation, LabTestRequest, Prescription } from '@/types/domain';

export async function startConsultation(appointmentId: number): Promise<Consultation> {
  const res = await apiClient.post<ApiSuccess<Consultation>>('/consultations', { appointmentId });
  return res.data.data;
}

export async function getConsultationById(id: number): Promise<Consultation> {
  const res = await apiClient.get<ApiSuccess<Consultation>>(`/consultations/${id}`);
  return res.data.data;
}

export async function getConsultationByAppointment(appointmentId: number): Promise<Consultation> {
  const res = await apiClient.get<ApiSuccess<Consultation>>(`/consultations/by-appointment/${appointmentId}`);
  return res.data.data;
}

export async function updateConsultationNotes(
  id: number,
  payload: { diagnosis?: string | null; notes?: string | null }
): Promise<Consultation> {
  const res = await apiClient.patch<ApiSuccess<Consultation>>(`/consultations/${id}`, payload);
  return res.data.data;
}

export interface AddPrescriptionPayload {
  medicineName: string;
  dosage: string;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export interface PrescriptionWithContext extends Prescription {
  // consultation context
  diagnosis: string | null;
  consultationNotes: string | null;
  consultationStartedAt: string | null;
  consultationCompletedAt: string | null;
  appointmentId: number;
  // doctor
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  doctorQualification: string | null;
  doctorPhone: string | null;
  departmentName: string;
  // patient
  patientName: string;
  patientCode: string;
  patientDateOfBirth: string;
  patientGender: string;
  patientPhone: string;
  patientEmail: string | null;
}

export async function getMyPrescriptions(): Promise<PrescriptionWithContext[]> {
  const res = await apiClient.get<ApiSuccess<PrescriptionWithContext[]>>('/consultations/prescriptions/me');
  return res.data.data;
}

export async function addPrescription(consultationId: number, payload: AddPrescriptionPayload): Promise<Prescription> {
  const res = await apiClient.post<ApiSuccess<Prescription>>(`/consultations/${consultationId}/prescriptions`, payload);
  return res.data.data;
}

export async function getPrescriptions(consultationId: number): Promise<Prescription[]> {
  const res = await apiClient.get<ApiSuccess<Prescription[]>>(`/consultations/${consultationId}/prescriptions`);
  return res.data.data;
}

export async function requestLabTest(consultationId: number, testName: string): Promise<LabTestRequest> {
  const res = await apiClient.post<ApiSuccess<LabTestRequest>>(`/consultations/${consultationId}/lab-tests`, {
    testName,
  });
  return res.data.data;
}

export async function listConsultationLabTests(consultationId: number): Promise<LabTestRequest[]> {
  const res = await apiClient.get<ApiSuccess<LabTestRequest[]>>(`/consultations/${consultationId}/lab-tests`);
  return res.data.data;
}

export async function completeConsultation(id: number): Promise<{ consultation: Consultation; nextStep: 'LABORATORY' | 'BILLING' }> {
  const res = await apiClient.patch<ApiSuccess<{ consultation: Consultation; nextStep: 'LABORATORY' | 'BILLING' }>>(
    `/consultations/${id}/complete`
  );
  return res.data.data;
}
