'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listAppointments } from '@/lib/api/appointments';
import { getApiErrorMessage } from '@/lib/api/client';
import { todayDateString } from '@/lib/formatDate';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

const QUICK_ACTIONS = [
  { href: '/patients', title: 'Search or Register Patient', description: 'Find an existing patient or register a walk-in.' },
  { href: '/appointments', title: 'Book Appointment', description: 'Schedule a new appointment for a patient.' },
  { href: '/check-in', title: 'Check-In', description: 'Check in a patient who has arrived for their appointment.' },
];

export function ReceptionistDashboard() {
  const today = todayDateString();
  const todaysAppointmentsQuery = useQuery({
    queryKey: ['appointments', 'today', today],
    queryFn: () => listAppointments({ fromDate: today, toDate: today }),
  });

  const appointments = todaysAppointmentsQuery.data ?? [];
  const checkedIn = appointments.filter((a) => a.status === 'CHECKED_IN').length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const upcoming = appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;

  return (
    <div className="flex flex-col gap-6">
      {todaysAppointmentsQuery.isLoading && <LoadingSpinner />}
      {todaysAppointmentsQuery.isError && <ErrorState message={getApiErrorMessage(todaysAppointmentsQuery.error)} />}
      {todaysAppointmentsQuery.data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Today's Appointments" value={appointments.length} />
          <StatCard label="Checked In" value={checkedIn} />
          <StatCard label="Still Expected" value={upcoming} />
          <StatCard label="Completed Today" value={completed} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="h-full transition-colors hover:border-brand-300 hover:bg-brand-50/40">
              <h2 className="text-sm font-semibold text-slate-900">{action.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{action.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
