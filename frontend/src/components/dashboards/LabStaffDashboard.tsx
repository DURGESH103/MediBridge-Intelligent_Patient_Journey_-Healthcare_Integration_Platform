'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listPendingLabWork } from '@/lib/api/laboratory';
import { getApiErrorMessage } from '@/lib/api/client';
import { labTestStatusStyle } from '@/lib/statusStyles';
import { formatDateTime } from '@/lib/formatDate';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function LabStaffDashboard() {
  const pendingQuery = useQuery({ queryKey: ['laboratory', 'pending'], queryFn: listPendingLabWork });

  if (pendingQuery.isLoading) return <LoadingSpinner />;
  if (pendingQuery.isError) return <ErrorState message={getApiErrorMessage(pendingQuery.error)} />;

  const pending = pendingQuery.data ?? [];
  const requested = pending.filter((t) => t.status === 'REQUESTED').length;
  const inProgress = pending.filter((t) => t.status === 'SAMPLE_COLLECTED' || t.status === 'PROCESSING').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Awaiting Sample Collection" value={requested} />
        <StatCard label="In Progress" value={inProgress} />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Pending Work</h2>
          <Link href="/lab" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {pending.length === 0 && <EmptyState title="No pending laboratory work" />}
        {pending.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {pending.slice(0, 8).map((test) => (
              <li key={test.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{test.testName}</p>
                  <p className="text-xs text-slate-500">Requested {formatDateTime(test.requestedAt)}</p>
                </div>
                <StatusBadge {...labTestStatusStyle(test.status)} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
