export enum ConsultationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Consultation {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  status: ConsultationStatus;
  diagnosis: string | null;
  notes: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: number;
  consultationId: number;
  medicineName: string;
  dosage: string;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  createdAt: Date;
}

export interface CreatePrescriptionInput {
  medicineName: string;
  dosage: string;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

export type NextStep = 'LABORATORY' | 'BILLING';
