export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface Patient {
  id: number;
  userId: number | null;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePatientInput {
  userId?: number | null;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

export type UpdatePatientInput = Partial<
  Omit<CreatePatientInput, 'userId'>
>;
