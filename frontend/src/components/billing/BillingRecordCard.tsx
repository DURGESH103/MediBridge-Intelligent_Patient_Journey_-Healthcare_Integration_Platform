'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markBillingPaid } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import { billingStatusStyle } from '@/lib/statusStyles';
import { formatDateTime } from '@/lib/formatDate';
import type { BillingRecord } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PatientNameLabel } from '@/components/patients/PatientNameLabel';

export function BillingRecordCard({ record }: { record: BillingRecord }) {
  const queryClient = useQueryClient();

  const markPaidMutation = useMutation({
    mutationFn: () => markBillingPaid(record.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing'] }),
  });

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            <PatientNameLabel patientId={record.patientId} />
          </p>
          <p className="text-xs text-slate-500">
            {record.amount != null ? `Amount: ${record.amount.toFixed(2)}` : 'Amount not set'} · Created{' '}
            {formatDateTime(record.createdAt)}
          </p>
        </div>
        <StatusBadge {...billingStatusStyle(record.status)} />
      </div>

      {record.status === 'PENDING' && (
        <>
          {markPaidMutation.isError && (
            <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(markPaidMutation.error)}</p>
          )}
          <Button
            className="mt-3"
            size="sm"
            isLoading={markPaidMutation.isPending}
            onClick={() => markPaidMutation.mutate()}
          >
            Mark as Paid
          </Button>
        </>
      )}
      {record.status === 'PAID' && record.paidAt && (
        <p className="mt-2 text-xs text-slate-400">Paid {formatDateTime(record.paidAt)}</p>
      )}
    </Card>
  );
}
