'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { formatRole } from '@/lib/formatRole';
import { PageHeader } from '@/components/layout/PageHeader';
import { PatientDashboard } from '@/components/dashboards/PatientDashboard';
import { DoctorDashboard } from '@/components/dashboards/DoctorDashboard';
import { ReceptionistDashboard } from '@/components/dashboards/ReceptionistDashboard';
import { LabStaffDashboard } from '@/components/dashboards/LabStaffDashboard';
import { BillingStaffDashboard } from '@/components/dashboards/BillingStaffDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';

export default function DashboardHomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, signed in as ${formatRole(user.role)}`} />
      {user.role === 'PATIENT' && <PatientDashboard />}
      {user.role === 'DOCTOR' && <DoctorDashboard />}
      {user.role === 'RECEPTIONIST' && <ReceptionistDashboard />}
      {user.role === 'LAB_STAFF' && <LabStaffDashboard />}
      {user.role === 'BILLING_STAFF' && <BillingStaffDashboard />}
      {user.role === 'ADMIN' && <AdminDashboard />}
    </>
  );
}
