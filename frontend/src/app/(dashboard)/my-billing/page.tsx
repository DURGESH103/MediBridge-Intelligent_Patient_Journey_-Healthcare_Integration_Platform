'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyPatientProfile } from '@/lib/api/patients';
import { listBillingForPatient } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import { billingStatusStyle } from '@/lib/statusStyles';
import { formatDateTime } from '@/lib/formatDate';
import { PageHeader } from '@/components/layout/PageHeader';
import { RequireRole } from '@/components/layout/RequireRole';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function MyBillingPage() {
  return (
    <RequireRole roles={['PATIENT']}>
      <MyBillingPageContent />
    </RequireRole>
  );
}

function MyBillingPageContent() {
  const patientQuery = useQuery({ queryKey: ['patients', 'me'], queryFn: getMyPatientProfile });
  const patientId = patientQuery.data?.id;

  const billingQuery = useQuery({
    queryKey: ['billing', 'patient', patientId],
    queryFn: () => listBillingForPatient(patientId!),
    enabled: Boolean(patientId),
  });

  if (patientQuery.isLoading) return <LoadingSpinner />;
  if (patientQuery.isError) return <ErrorState message={getApiErrorMessage(patientQuery.error)} />;

  const records = billingQuery.data ?? [];
  const totalPaid = records
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const totalPending = records
    .filter((r) => r.status === 'PENDING')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="My Billing"
        description="Billing records for your completed consultations."
      />

      {billingQuery.isLoading && <LoadingSpinner />}
      {billingQuery.isError && <ErrorState message={getApiErrorMessage(billingQuery.error)} />}

      {billingQuery.data && records.length === 0 && (
        <EmptyState
          title="No billing records yet"
          description="Billing records will appear here after your consultations are completed."
        />
      )}

      {records.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-xs text-slate-500">Amount Pending</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {totalPending > 0 ? totalPending.toFixed(2) : '—'}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {totalPaid > 0 ? totalPaid.toFixed(2) : '—'}
              </p>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            {records.map((record) => (
              <Card key={record.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {record.amount != null
                        ? `Amount: ${record.amount.toFixed(2)}`
                        : 'Amount not set'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Created {formatDateTime(record.createdAt)}
                    </p>
                    {record.paidAt && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Paid{record.paymentMethod ? ` via ${record.paymentMethod}` : ''} · {formatDateTime(record.paidAt)}
                      </p>
                    )}
                  </div>
                  <StatusBadge {...billingStatusStyle(record.status)} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
