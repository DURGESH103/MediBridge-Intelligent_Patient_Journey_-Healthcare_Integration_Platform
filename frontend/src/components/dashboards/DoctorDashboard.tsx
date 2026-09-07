'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getMyDoctorProfile } from '@/lib/api/doctors';
import { listAppointments } from '@/lib/api/appointments';
import { getDoctorQueueSummary } from '@/lib/api/queue';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatTime, todayDateString } from '@/lib/formatDate';
import { appointmentStatusStyle } from '@/lib/statusStyles';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function DoctorDashboard() {
  const doctorQuery = useQuery({ queryKey: ['doctors', 'me'], queryFn: getMyDoctorProfile });
  const doctorId = doctorQuery.data?.id;

  const queueSummaryQuery = useQuery({
    queryKey: ['queue', 'summary', doctorId],
    queryFn: () => getDoctorQueueSummary(doctorId!),
    enabled: Boolean(doctorId),
  });

  const today = todayDateString();
  const todaysAppointmentsQuery = useQuery({
    queryKey: ['appointments', 'doctor', doctorId, today],
    queryFn: () => listAppointments({ doctorId, fromDate: today, toDate: today }),
    enabled: Boolean(doctorId),
  });

  if (doctorQuery.isLoading) return <LoadingSpinner />;
  if (doctorQuery.isError) return <ErrorState message={getApiErrorMessage(doctorQuery.error)} />;

  const todaysAppointments = (todaysAppointmentsQuery.data ?? []).sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Currently Serving" value={queueSummaryQuery.data?.currentlyServingToken ?? '—'} />
        <StatCard label="Patients Waiting" value={queueSummaryQuery.data?.totalWaiting ?? '—'} />
        <StatCard label="Today's Appointments" value={todaysAppointments.length} />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Today&apos;s Appointments</h2>
          <Link href="/queue" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Go to queue
          </Link>
        </div>

        {todaysAppointmentsQuery.isLoading && <LoadingSpinner />}
        {todaysAppointmentsQuery.isError && <ErrorState message={getApiErrorMessage(todaysAppointmentsQuery.error)} />}
        {todaysAppointments.length === 0 && !todaysAppointmentsQuery.isLoading && (
          <EmptyState title="No appointments scheduled for today" />
        )}
        {todaysAppointments.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {todaysAppointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{formatTime(a.scheduledAt)}</p>
                  {a.reason && <p className="text-xs text-slate-500">{a.reason}</p>}
                </div>
                <StatusBadge {...appointmentStatusStyle(a.status)} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
