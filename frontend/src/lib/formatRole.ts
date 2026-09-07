import type { UserRole } from '@/types/roles';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Receptionist',
  LAB_STAFF: 'Lab Staff',
  BILLING_STAFF: 'Billing Staff',
};

export function formatRole(role: UserRole): string {
  return ROLE_LABELS[role];
}
