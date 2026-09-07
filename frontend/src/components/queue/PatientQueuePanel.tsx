'use client';

import { useQuery } from '@tanstack/react-query';
import { listAppointments } from '@/lib/api/appointments';
import { getQueueEntryByAppointment, getQueueEntryStatus } from '@/lib/api/queue';
import { getApiErrorMessage } from '@/lib/api/client';
import { useQueueRealtime } from '@/lib/socket/useQueueRealtime';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { BigStat } from './BigStat';

export function PatientQueuePanel() {
  const appointmentsQuery = useQuery({ queryKey: ['appointments', 'me'], queryFn: () => listAppointments() });
  const checkedInAppointment = appointmentsQuery.data?.find((a) => a.status === 'CHECKED_IN');

  const entryQuery = useQuery({
    queryKey: ['queue', 'entry', 'byAppointment', checkedInAppointment?.id],
    queryFn: () => getQueueEntryByAppointment(checkedInAppointment!.id),
    enabled: Boolean(checkedInAppointment),
  });

  const statusQuery = useQuery({
    queryKey: ['queue', 'status', entryQuery.data?.id],
    queryFn: () => getQueueEntryStatus(entryQuery.data!.id),
    enabled: Boolean(entryQuery.data),
  });

  useQueueRealtime(entryQuery.data?.doctorId);

  if (appointmentsQuery.isLoading) return <LoadingSpinner />;
  if (appointmentsQuery.isError) return <ErrorState message={getApiErrorMessage(appointmentsQuery.error)} />;

  if (!checkedInAppointment) {
    return (
      <EmptyState
        title="You're not currently in a queue"
        description="Once you check in for an appointment, your live queue position will show up here."
      />
    );
  }

  if (entryQuery.isLoading || statusQuery.isLoading) return <LoadingSpinner />;
  if (entryQuery.isError) return <ErrorState message={getApiErrorMessage(entryQuery.error)} />;
  if (statusQuery.isError) return <ErrorState message={getApiErrorMessage(statusQuery.error)} />;

  const status = statusQuery.data;
  if (!status?.yourEntry) return null;

  if (status.yourEntry.status === 'IN_PROGRESS') {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold text-emerald-700">You&apos;re being seen now</p>
        <p className="mt-1 text-sm text-slate-500">Token #{status.yourEntry.tokenNumber}</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <BigStat label="Your Token" value={status.yourEntry.tokenNumber} />
        <BigStat label="Currently Serving" value={status.currentlyServingToken ?? '—'} />
        <BigStat label="Patients Ahead" value={status.yourEntry.patientsAhead} />
        <BigStat label="Estimated Wait" value={`${status.yourEntry.estimatedWaitMinutes} min`} />
      </div>
    </Card>
  );
}
