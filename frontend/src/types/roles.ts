export type UserRole = 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'LAB_STAFF' | 'BILLING_STAFF';

export interface SafeUser {
  id: number;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
