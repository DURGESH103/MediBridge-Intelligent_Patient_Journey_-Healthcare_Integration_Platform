'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getMyDoctorProfile } from '@/lib/api/doctors';
import { listAppointments } from '@/lib/api/appointments';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatTime, todayDateString } from '@/lib/formatDate';
import { appointmentStatusStyle } from '@/lib/statusStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PatientNameLabel } from '@/components/patients/PatientNameLabel';

const RELEVANT_STATUSES = new Set(['CHECKED_IN', 'COMPLETED']);

export default function ConsultationsPage() {
  return (
    <RequireRole roles={['DOCTOR']}>
      <ConsultationsPageContent />
    </RequireRole>
  );
}

function ConsultationsPageContent() {
  const doctorQuery = useQuery({ queryKey: ['doctors', 'me'], queryFn: getMyDoctorProfile });
  const doctorId = doctorQuery.data?.id;
  const today = todayDateString();

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'doctor', doctorId, today],
    queryFn: () => listAppointments({ doctorId, fromDate: today, toDate: today }),
    enabled: Boolean(doctorId),
  });

  if (doctorQuery.isLoading) return <LoadingSpinner />;
  if (doctorQuery.isError) return <ErrorState message={getApiErrorMessage(doctorQuery.error)} />;

  const appointments = (appointmentsQuery.data ?? [])
    .filter((a) => RELEVANT_STATUSES.has(a.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <>
      <PageHeader title="Consultations" description="Today's checked-in and completed patients." />

      {appointmentsQuery.isLoading && <LoadingSpinner />}
      {appointmentsQuery.isError && <ErrorState message={getApiErrorMessage(appointmentsQuery.error)} />}
      {appointments.length === 0 && !appointmentsQuery.isLoading && (
        <EmptyState
          title="No patients ready for consultation"
          description="Patients will appear here once they check in for today's appointments."
        />
      )}
      {appointments.length > 0 && (
        <Card>
          <ul className="divide-y divide-slate-100">
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <Link
                  href={`/consultations/${appointment.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      <PatientNameLabel patientId={appointment.patientId} />
                    </p>
                    <p className="text-xs text-slate-500">{formatTime(appointment.scheduledAt)}</p>
                  </div>
                  <StatusBadge {...appointmentStatusStyle(appointment.status)} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
