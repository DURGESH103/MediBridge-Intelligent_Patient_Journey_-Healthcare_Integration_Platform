'use client';

import { useQuery } from '@tanstack/react-query';
import { listDepartments, listDoctors } from '@/lib/api/doctors';
import { listUsers } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';
import { StatCard } from '@/components/ui/StatCard';
import { ErrorState } from '@/components/ui/ErrorState';

export function AdminDashboard() {
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: listDepartments });
  const doctorsQuery = useQuery({ queryKey: ['doctors'], queryFn: () => listDoctors() });
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: () => listUsers() });

  const firstError = departmentsQuery.error ?? doctorsQuery.error ?? usersQuery.error;
  if (firstError) return <ErrorState message={getApiErrorMessage(firstError)} />;

  const staffCount = (usersQuery.data ?? []).filter((u) => u.role !== 'PATIENT').length;
  const patientCount = (usersQuery.data ?? []).filter((u) => u.role === 'PATIENT').length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Departments" value={departmentsQuery.data?.length ?? '—'} />
      <StatCard label="Active Doctors" value={doctorsQuery.data?.length ?? '—'} />
      <StatCard label="Staff Accounts" value={staffCount || '—'} />
      <StatCard label="Registered Patients" value={patientCount || '—'} />
    </div>
  );
}
