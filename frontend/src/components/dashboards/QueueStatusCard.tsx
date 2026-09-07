'use client';

import Link from 'next/link';
import { useMyQueueStatus } from '@/lib/queue/useMyQueueStatus';
import { getApiErrorMessage } from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { BigStat } from '@/components/queue/BigStat';

/**
 * Compact queue summary for the patient dashboard - only renders when the
 * patient is actively checked in somewhere today. Full queue details (call
 * history, doctor board, etc.) stay on the dedicated /queue page; this is
 * just the "am I in a queue right now, and where do I stand" glance.
 */
export function QueueStatusCard() {
  const { appointmentsQuery, checkedInAppointment, entryQuery, statusQuery } = useMyQueueStatus();

  if (appointmentsQuery.isLoading || !checkedInAppointment) return null;
  if (entryQuery.isLoading || statusQuery.isLoading) {
    return (
      <Card>
        <LoadingSpinner />
      </Card>
    );
  }
  if (entryQuery.isError) return <ErrorState message={getApiErrorMessage(entryQuery.error)} />;
  if (statusQuery.isError) return <ErrorState message={getApiErrorMessage(statusQuery.error)} />;

  const status = statusQuery.data;
  if (!status?.yourEntry) return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Queue Status</h2>
        <Link href="/queue" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          View queue
        </Link>
      </div>

      {status.yourEntry.status === 'IN_PROGRESS' ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">You&apos;re being seen now</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-4">
          <BigStat label="Your Token" value={status.yourEntry.tokenNumber} />
          <BigStat label="Currently Serving" value={status.currentlyServingToken ?? '—'} />
          <BigStat label="Patients Ahead" value={status.yourEntry.patientsAhead} />
          <BigStat label="Est. Wait" value={`${status.yourEntry.estimatedWaitMinutes} min`} />
        </div>
      )}
    </Card>
  );
}
