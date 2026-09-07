'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { getMyDoctorProfile, listDoctors } from '@/lib/api/doctors';
import { getApiErrorMessage } from '@/lib/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { PatientQueuePanel } from '@/components/queue/PatientQueuePanel';
import { DoctorQueueBoard } from '@/components/queue/DoctorQueueBoard';

export default function QueuePage() {
  return (
    <RequireRole roles={['PATIENT', 'DOCTOR', 'RECEPTIONIST']}>
      <QueuePageContent />
    </RequireRole>
  );
}

function QueuePageContent() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="Queue" description="Live queue status." />
      {user?.role === 'PATIENT' && <PatientQueuePanel />}
      {user?.role === 'DOCTOR' && <DoctorQueueView />}
      {user?.role === 'RECEPTIONIST' && <ReceptionistQueueView />}
    </>
  );
}

function DoctorQueueView() {
  const doctorQuery = useQuery({ queryKey: ['doctors', 'me'], queryFn: getMyDoctorProfile });

  if (doctorQuery.isLoading) return <LoadingSpinner />;
  if (doctorQuery.isError) return <ErrorState message={getApiErrorMessage(doctorQuery.error)} />;
  if (!doctorQuery.data) return null;

  return <DoctorQueueBoard doctorId={doctorQuery.data.id} />;
}

function ReceptionistQueueView() {
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const doctorsQuery = useQuery({ queryKey: ['doctors'], queryFn: () => listDoctors() });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <label htmlFor="doctorSelect" className="text-sm font-medium text-slate-700">
          Select Doctor
        </label>
        {doctorsQuery.isLoading && <LoadingSpinner />}
        {doctorsQuery.isError && <ErrorState message={getApiErrorMessage(doctorsQuery.error)} />}
        {doctorsQuery.data && (
          <select
            id="doctorSelect"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            value={doctorId ?? ''}
            onChange={(e) => setDoctorId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a doctor…</option>
            {doctorsQuery.data.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.fullName} · {doctor.specialization}
              </option>
            ))}
          </select>
        )}
      </Card>

      {doctorId && <DoctorQueueBoard doctorId={doctorId} />}
    </div>
  );
}
