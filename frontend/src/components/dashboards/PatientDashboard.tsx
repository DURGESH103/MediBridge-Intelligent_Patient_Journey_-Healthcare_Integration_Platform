'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMyCurrentJourney } from '@/lib/api/journey';
import { listAppointments } from '@/lib/api/appointments';
import { listMyNotifications } from '@/lib/api/notifications';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/formatDate';
import { appointmentStatusStyle } from '@/lib/statusStyles';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { JourneyChecklist } from '@/components/journey/JourneyChecklist';
import { Button } from '@/components/ui/Button';

export function PatientDashboard() {
  const router = useRouter();
  const journeyQuery = useQuery({
    queryKey: ['journey', 'me'],
    queryFn: getMyCurrentJourney,
    retry: false,
  });
  const appointmentsQuery = useQuery({ queryKey: ['appointments', 'me'], queryFn: () => listAppointments() });
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me', 1],
    queryFn: () => listMyNotifications(1, 5),
  });

  const upcomingAppointments = (appointmentsQuery.data ?? [])
    .filter((a) => ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const nextAppointment = upcomingAppointments[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <h2 className="text-base font-semibold text-slate-900">My Healthcare Journey</h2>
        {journeyQuery.isLoading && <LoadingSpinner />}
        {journeyQuery.isError && (
          <p className="mt-4 text-sm text-slate-500">
            {getApiErrorMessage(journeyQuery.error) === 'This patient has no appointments yet'
              ? 'Your journey will appear here once you book your first appointment.'
              : getApiErrorMessage(journeyQuery.error)}
          </p>
        )}
        {journeyQuery.data && (
          <div className="mt-5">
            <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
              {journeyQuery.data.nextAction}
            </p>
            <JourneyChecklist stages={journeyQuery.data.stages} />
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Upcoming Appointment</h2>
          {appointmentsQuery.isLoading && <LoadingSpinner />}
          {appointmentsQuery.isError && <ErrorState message={getApiErrorMessage(appointmentsQuery.error)} />}
          {appointmentsQuery.data && !nextAppointment && (
            <EmptyState
              title="No upcoming appointments"
              description="Book an appointment to get started."
              action={
                <Button size="sm" onClick={() => router.push('/appointments')}>
                  Book Appointment
                </Button>
              }
            />
          )}
          {nextAppointment && (
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{formatDateTime(nextAppointment.scheduledAt)}</p>
                {nextAppointment.reason && <p className="text-xs text-slate-500">{nextAppointment.reason}</p>}
              </div>
              <StatusBadge {...appointmentStatusStyle(nextAppointment.status)} />
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Notifications</h2>
            <Link href="/notifications" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          {notificationsQuery.isLoading && <LoadingSpinner />}
          {notificationsQuery.isError && <ErrorState message={getApiErrorMessage(notificationsQuery.error)} />}
          {notificationsQuery.data && notificationsQuery.data.length === 0 && (
            <EmptyState title="No notifications yet" />
          )}
          {notificationsQuery.data && notificationsQuery.data.length > 0 && (
            <ul className="mt-3 flex flex-col gap-3">
              {notificationsQuery.data.map((n) => (
                <li key={n.id} className={n.isRead ? 'opacity-60' : ''}>
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
