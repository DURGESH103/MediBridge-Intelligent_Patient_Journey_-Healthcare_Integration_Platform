'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { listAppointments } from '@/lib/api/appointments';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatDateTime, todayDateString } from '@/lib/formatDate';
import { appointmentStatusStyle } from '@/lib/statusStyles';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AppointmentsPage() {
  return (
    <RequireRole roles={['PATIENT', 'RECEPTIONIST']}>
      <AppointmentsPageContent />
    </RequireRole>
  );
}

function AppointmentsPageContent() {
  const { user } = useAuth();
  const isStaff = user?.role === 'RECEPTIONIST';
  const [dateFilter, setDateFilter] = useState(todayDateString());

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', isStaff ? dateFilter : 'me'],
    queryFn: () => listAppointments(isStaff ? { fromDate: dateFilter, toDate: dateFilter } : {}),
  });

  const appointments = (appointmentsQuery.data ?? []).slice().sort((a, b) => {
    // Soonest upcoming first, then most recent past.
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  });

  return (
    <>
      <PageHeader
        title="Appointments"
        description={isStaff ? 'View and manage appointments by date.' : 'Your upcoming and past appointments.'}
        action={
          <Link href="/appointments/book">
            <Button>Book Appointment</Button>
          </Link>
        }
      />

      {isStaff && (
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <label htmlFor="dateFilter" className="text-sm font-medium text-slate-700">
              Date
            </label>
            <Input
              id="dateFilter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-auto"
            />
          </div>
        </Card>
      )}

      <Card>
        {appointmentsQuery.isLoading && <LoadingSpinner />}
        {appointmentsQuery.isError && <ErrorState message={getApiErrorMessage(appointmentsQuery.error)} />}
        {appointments.length === 0 && !appointmentsQuery.isLoading && (
          <EmptyState
            title="No appointments"
            description={isStaff ? 'No appointments scheduled for this date.' : "You don't have any appointments yet."}
          />
        )}
        {appointments.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {appointments.map((appt) => (
              <li key={appt.id}>
                <Link
                  href={`/appointments/${appt.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatDateTime(appt.scheduledAt)}</p>
                    {appt.reason && <p className="text-xs text-slate-500">{appt.reason}</p>}
                  </div>
                  <StatusBadge {...appointmentStatusStyle(appt.status)} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
