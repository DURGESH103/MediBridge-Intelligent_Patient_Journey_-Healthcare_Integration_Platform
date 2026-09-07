export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  scheduledAt: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentInput {
  patientId: number;
  doctorId: number;
  scheduledAt: string;
  reason?: string | null;
}

export interface AppointmentFilters {
  patientId?: number;
  doctorId?: number;
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
}
