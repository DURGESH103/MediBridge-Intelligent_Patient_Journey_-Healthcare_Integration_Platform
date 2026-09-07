'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listCompletedBilling, listPendingBilling } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { BillingRecordCard } from '@/components/billing/BillingRecordCard';

export default function BillingPage() {
  return (
    <RequireRole roles={['BILLING_STAFF', 'ADMIN']}>
      <BillingPageContent />
    </RequireRole>
  );
}

function BillingPageContent() {
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  const pendingQuery = useQuery({
    queryKey: ['billing', 'pending'],
    queryFn: listPendingBilling,
    enabled: tab === 'pending',
  });
  const completedQuery = useQuery({
    queryKey: ['billing', 'completed'],
    queryFn: listCompletedBilling,
    enabled: tab === 'completed',
  });

  const activeQuery = tab === 'pending' ? pendingQuery : completedQuery;
  const records = activeQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Billing"
        description="Pending and completed billing cases for finished consultations."
        action={
          <div className="flex gap-2">
            <Button variant={tab === 'pending' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('pending')}>
              Pending
            </Button>
            <Button variant={tab === 'completed' ? 'primary' : 'outline'} size="sm" onClick={() => setTab('completed')}>
              Completed
            </Button>
          </div>
        }
      />

      {activeQuery.isLoading && <LoadingSpinner />}
      {activeQuery.isError && <ErrorState message={getApiErrorMessage(activeQuery.error)} />}
      {records.length === 0 && !activeQuery.isLoading && (
        <EmptyState title={tab === 'pending' ? 'No pending billing cases' : 'No completed billing cases yet'} />
      )}
      {records.length > 0 && (
        <div className="flex flex-col gap-4">
          {records.map((record) => (
            <BillingRecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </>
  );
}
