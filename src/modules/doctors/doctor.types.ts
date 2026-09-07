export interface Doctor {
  id: number;
  userId: number;
  departmentId: number;
  fullName: string;
  specialization: string;
  qualification: string | null;
  phone: string | null;
  consultationFee: number | null;
  averageConsultationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDoctorInput {
  userId: number;
  departmentId: number;
  fullName: string;
  specialization: string;
  qualification?: string | null;
  phone?: string | null;
  consultationFee?: number | null;
  averageConsultationMinutes?: number;
}

export type UpdateDoctorInput = Partial<Omit<CreateDoctorInput, 'userId'>>;

export interface DoctorAvailability {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface SetAvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
