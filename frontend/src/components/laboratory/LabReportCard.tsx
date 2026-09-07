'use client';

import { useQuery } from '@tanstack/react-query';
import { getLabReport } from '@/lib/api/laboratory';
import { getApiErrorMessage } from '@/lib/api/client';
import { labTestStatusStyle } from '@/lib/statusStyles';
import { formatDateTime } from '@/lib/formatDate';
import type { LabTestRequest } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function LabReportCard({ request }: { request: LabTestRequest }) {
  const reportQuery = useQuery({
    queryKey: ['laboratory', request.id, 'report'],
    queryFn: () => getLabReport(request.id),
    enabled: request.status === 'COMPLETED',
  });

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{request.testName}</p>
          <p className="text-xs text-slate-500">Requested {formatDateTime(request.requestedAt)}</p>
        </div>
        <StatusBadge {...labTestStatusStyle(request.status)} />
      </div>

      {request.status === 'COMPLETED' && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {reportQuery.isLoading && <LoadingSpinner />}
          {reportQuery.isError && <ErrorState message={getApiErrorMessage(reportQuery.error)} />}
          {reportQuery.data && (
            <>
              <p className="text-xs text-slate-500">Result Summary</p>
              <p className="mt-1 text-sm text-slate-700">{reportQuery.data.resultSummary}</p>
              {reportQuery.data.reportFileUrl && (
                <a
                  href={reportQuery.data.reportFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View full report
                </a>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
