'use client';

import { useState } from 'react';
import { billingStatusStyle } from '@/lib/statusStyles';
import { formatDateTime } from '@/lib/formatDate';
import type { BillingRecord } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PatientNameLabel } from '@/components/patients/PatientNameLabel';
import { PaymentModal } from './PaymentModal';

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
};

export function BillingRecordCard({ record }: { record: BillingRecord }) {
  const [isPaying, setIsPaying] = useState(false);

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
        <Button className="mt-3" size="sm" onClick={() => setIsPaying(true)}>
          Collect Payment
        </Button>
      )}
      {record.status === 'PAID' && (
        <p className="mt-2 text-xs text-slate-400">
          Paid{record.paymentMethod ? ` via ${PAYMENT_METHOD_LABEL[record.paymentMethod]}` : ''}
          {record.paymentReference ? ` (${record.paymentReference})` : ''}
          {record.paidAt ? ` · ${formatDateTime(record.paidAt)}` : ''}
        </p>
      )}

      {isPaying && <PaymentModal record={record} onClose={() => setIsPaying(false)} />}
    </Card>
  );
}
