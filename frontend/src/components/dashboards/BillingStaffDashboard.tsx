'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listPendingBilling } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/formatDate';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PatientNameLabel } from '@/components/patients/PatientNameLabel';

export function BillingStaffDashboard() {
  const pendingQuery = useQuery({ queryKey: ['billing', 'pending'], queryFn: listPendingBilling });

  if (pendingQuery.isLoading) return <LoadingSpinner />;
  if (pendingQuery.isError) return <ErrorState message={getApiErrorMessage(pendingQuery.error)} />;

  const pending = pendingQuery.data ?? [];
  const totalDue = pending.reduce((sum, record) => sum + (record.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Pending Billing Cases" value={pending.length} />
        <StatCard label="Total Amount Due" value={totalDue.toFixed(2)} />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Pending Billing</h2>
          <Link href="/billing" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {pending.length === 0 && <EmptyState title="No pending billing cases" />}
        {pending.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-100">
            {pending.slice(0, 8).map((record) => (
              <li key={record.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    <PatientNameLabel patientId={record.patientId} />
                  </p>
                  <p className="text-xs text-slate-500">Created {formatDateTime(record.createdAt)}</p>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {record.amount != null ? record.amount.toFixed(2) : '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
