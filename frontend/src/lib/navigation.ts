import type { UserRole } from '@/types/roles';

export interface NavItem {
  label: string;
  href: string;
}

// Each role only sees the sections relevant to its workflow. Items point at
// routes that exist now or will exist by the end of their build phase -
// nothing here should ever 404.
export const NAV_ITEMS_BY_ROLE: Record<UserRole, NavItem[]> = {
  PATIENT: [
    { label: 'Dashboard', href: '/' },
    { label: 'My Journey', href: '/journey' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Queue Status', href: '/queue' },
    { label: 'Prescriptions', href: '/my-prescriptions' },
    { label: 'Lab Reports', href: '/lab-reports' },
    { label: 'My Billing', href: '/my-billing' },
    { label: 'Notifications', href: '/notifications' },
    { label: 'Profile', href: '/profile' },
  ],
  DOCTOR: [
    { label: 'Dashboard', href: '/' },
    { label: 'Queue', href: '/queue' },
    { label: 'Consultations', href: '/consultations' },
    { label: 'Availability', href: '/availability' },
    { label: 'Notifications', href: '/notifications' },
    { label: 'Profile', href: '/profile' },
  ],
  RECEPTIONIST: [
    { label: 'Dashboard', href: '/' },
    { label: 'Patients', href: '/patients' },
    { label: 'Appointments', href: '/appointments' },
    { label: 'Check-In', href: '/check-in' },
    { label: 'Queue', href: '/queue' },
    { label: 'Notifications', href: '/notifications' },
    { label: 'Profile', href: '/profile' },
  ],
  LAB_STAFF: [
    { label: 'Dashboard', href: '/' },
    { label: 'Lab Queue', href: '/lab' },
    { label: 'Notifications', href: '/notifications' },
    { label: 'Profile', href: '/profile' },
  ],
  BILLING_STAFF: [
    { label: 'Dashboard', href: '/' },
    { label: 'Billing', href: '/billing' },
    { label: 'Notifications', href: '/notifications' },
    { label: 'Profile', href: '/profile' },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/' },
    { label: 'Departments', href: '/departments' },
    { label: 'Doctors', href: '/doctors' },
    { label: 'Staff Users', href: '/users' },
    { label: 'Patients', href: '/patients' },
    { label: 'Notifications', href: '/notifications' },
    { label: 'Profile', href: '/profile' },
  ],
};
