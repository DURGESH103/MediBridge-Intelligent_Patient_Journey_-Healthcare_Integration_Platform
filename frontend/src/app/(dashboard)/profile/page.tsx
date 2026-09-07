'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { AccountDetailsCard } from '@/components/profile/AccountDetailsCard';
import { ChangePasswordCard } from '@/components/profile/ChangePasswordCard';
import { PatientProfileCard } from '@/components/profile/PatientProfileCard';
import { DoctorProfileCard } from '@/components/profile/DoctorProfileCard';

export default function ProfilePage() {
  return (
    <RequireRole roles={['ADMIN', 'PATIENT', 'DOCTOR', 'RECEPTIONIST', 'LAB_STAFF', 'BILLING_STAFF']}>
      <ProfilePageContent />
    </RequireRole>
  );
}

function ProfilePageContent() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="My Profile" description="View and update your account information." />
      <div className="flex flex-col gap-6">
        <AccountDetailsCard />
        {user?.role === 'PATIENT' && <PatientProfileCard />}
        {user?.role === 'DOCTOR' && <DoctorProfileCard />}
        <ChangePasswordCard />
      </div>
    </>
  );
}
