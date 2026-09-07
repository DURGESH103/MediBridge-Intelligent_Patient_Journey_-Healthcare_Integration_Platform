'use client';

import { useQuery } from '@tanstack/react-query';
import { listPendingLabWork } from '@/lib/api/laboratory';
import { getApiErrorMessage } from '@/lib/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { LabRequestCard } from '@/components/laboratory/LabRequestCard';

export default function LabQueuePage() {
  return (
    <RequireRole roles={['LAB_STAFF']}>
      <LabQueuePageContent />
    </RequireRole>
  );
}

function LabQueuePageContent() {
  const pendingQuery = useQuery({ queryKey: ['laboratory', 'pending'], queryFn: listPendingLabWork });

  return (
    <>
      <PageHeader title="Lab Queue" description="Tests awaiting sample collection, processing, or results." />

      {pendingQuery.isLoading && <LoadingSpinner />}
      {pendingQuery.isError && <ErrorState message={getApiErrorMessage(pendingQuery.error)} />}
      {pendingQuery.data && pendingQuery.data.length === 0 && <EmptyState title="No pending laboratory work" />}
      {pendingQuery.data && pendingQuery.data.length > 0 && (
        <div className="flex flex-col gap-4">
          {pendingQuery.data.map((request) => (
            <LabRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </>
  );
}
