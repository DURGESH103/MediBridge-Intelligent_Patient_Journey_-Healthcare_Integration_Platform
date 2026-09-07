'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  callNextPatient,
  completeQueueEntry,
  getDoctorQueue,
  getDoctorQueueSummary,
  skipQueueEntry,
} from '@/lib/api/queue';
import { getApiErrorMessage } from '@/lib/api/client';
import { useQueueRealtime } from '@/lib/socket/useQueueRealtime';
import { queueStatusStyle } from '@/lib/statusStyles';
import { formatTime } from '@/lib/formatDate';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BigStat } from './BigStat';

export function DoctorQueueBoard({ doctorId }: { doctorId: number }) {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({ queryKey: ['queue', 'summary', doctorId], queryFn: () => getDoctorQueueSummary(doctorId) });
  const listQuery = useQuery({ queryKey: ['queue', 'doctor', doctorId], queryFn: () => getDoctorQueue(doctorId) });

  useQueueRealtime(doctorId);

  function invalidateQueue() {
    queryClient.invalidateQueries({ queryKey: ['queue'] });
  }

  const callNextMutation = useMutation({
    mutationFn: () => callNextPatient(doctorId),
    onSuccess: invalidateQueue,
  });
  const completeMutation = useMutation({
    mutationFn: (entryId: number) => completeQueueEntry(entryId),
    onSuccess: invalidateQueue,
  });
  const skipMutation = useMutation({
    mutationFn: (entryId: number) => skipQueueEntry(entryId),
    onSuccess: invalidateQueue,
  });

  if (summaryQuery.isLoading || listQuery.isLoading) return <LoadingSpinner />;
  if (summaryQuery.isError) return <ErrorState message={getApiErrorMessage(summaryQuery.error)} />;
  if (listQuery.isError) return <ErrorState message={getApiErrorMessage(listQuery.error)} />;

  const entries = listQuery.data ?? [];
  const inProgress = entries.find((e) => e.status === 'IN_PROGRESS');
  const mutationError = callNextMutation.error ?? completeMutation.error ?? skipMutation.error;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2">
          <BigStat label="Currently Serving" value={summaryQuery.data?.currentlyServingToken ?? '—'} />
          <BigStat label="Patients Waiting" value={summaryQuery.data?.totalWaiting ?? 0} />
        </div>
      </Card>

      {mutationError ? <p className="text-sm text-red-600">{getApiErrorMessage(mutationError)}</p> : null}

      <div>
        <Button isLoading={callNextMutation.isPending} disabled={Boolean(inProgress)} onClick={() => callNextMutation.mutate()}>
          Call Next Patient
        </Button>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Queue</h2>
        {entries.length === 0 && <EmptyState title="No patients checked in yet" />}
        {entries.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Token #{entry.tokenNumber}
                    {entry.calledAt && <span className="ml-2 text-xs text-slate-400">called {formatTime(entry.calledAt)}</span>}
                  </p>
                  <p className="text-xs text-slate-500">Checked in {formatTime(entry.checkedInAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge {...queueStatusStyle(entry.status)} />
                  {entry.status === 'IN_PROGRESS' && (
                    <>
                      <Button
                        size="sm"
                        isLoading={completeMutation.isPending && completeMutation.variables === entry.id}
                        onClick={() => completeMutation.mutate(entry.id)}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={skipMutation.isPending && skipMutation.variables === entry.id}
                        onClick={() => skipMutation.mutate(entry.id)}
                      >
                        Skip
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
