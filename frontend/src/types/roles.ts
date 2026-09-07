export type UserRole = 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'LAB_STAFF' | 'BILLING_STAFF';

export interface SafeUser {
  id: number;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
