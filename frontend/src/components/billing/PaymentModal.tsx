'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markBillingPaid } from '@/lib/api/billing';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  cardBrand,
  cardPaymentSchema,
  upiPaymentSchema,
  type CardPaymentFormValues,
  type UpiPaymentFormValues,
} from '@/lib/validation/billingSchemas';
import type { BillingRecord, PaymentMethod } from '@/types/domain';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Demo clinic UPI VPA - a real deployment would source this from clinic
// settings/env instead of hardcoding it.
const UPI_MERCHANT_VPA = 'medibridge@ybl';
const UPI_PAYEE_NAME = 'MediBridge Healthcare';

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'CASH', label: 'Cash' },
  { id: 'UPI', label: 'UPI' },
  { id: 'CARD', label: 'Card' },
];

export function PaymentModal({ record, onClose }: { record: BillingRecord; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const amountLabel = record.amount != null ? record.amount.toFixed(2) : '—';

  const payMutation = useMutation({
    mutationFn: (vars: { paymentMethod: PaymentMethod; paymentReference?: string }) =>
      markBillingPaid(record.id, vars.paymentMethod, vars.paymentReference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Collect Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Amount due: {amountLabel}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-100 px-6 pt-3 flex-shrink-0">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`rounded-t-md px-3 py-2 text-sm font-medium ${
                method === m.id
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {payMutation.isError && (
            <p className="mb-3 text-sm text-red-600">{getApiErrorMessage(payMutation.error)}</p>
          )}

          {method === 'CASH' && (
            <CashPanel
              amountLabel={amountLabel}
              isSubmitting={payMutation.isPending}
              onConfirm={() => payMutation.mutate({ paymentMethod: 'CASH' })}
            />
          )}
          {method === 'UPI' && (
            <UpiPanel
              amount={record.amount}
              billingId={record.id}
              isSubmitting={payMutation.isPending}
              onConfirm={(transactionRef) => payMutation.mutate({ paymentMethod: 'UPI', paymentReference: transactionRef })}
            />
          )}
          {method === 'CARD' && (
            <CardPanel
              isSubmitting={payMutation.isPending}
              onConfirm={(reference) => payMutation.mutate({ paymentMethod: 'CARD', paymentReference: reference })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cash ─────────────────────────────────────────────────────────────────────
function CashPanel({
  amountLabel,
  isSubmitting,
  onConfirm,
}: {
  amountLabel: string;
  isSubmitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <p className="text-sm text-slate-600">
        Confirm that <span className="font-semibold text-slate-900">{amountLabel}</span> in cash has been received
        from the patient.
      </p>
      <Button isLoading={isSubmitting} onClick={onConfirm}>
        Confirm Cash Received
      </Button>
    </div>
  );
}

// ─── UPI ──────────────────────────────────────────────────────────────────────
function UpiPanel({
  amount,
  billingId,
  isSubmitting,
  onConfirm,
}: {
  amount: number | null;
  billingId: number;
  isSubmitting: boolean;
  onConfirm: (transactionRef: string) => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const note = `Invoice-${billingId}`;
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_MERCHANT_VPA)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${
    amount ?? ''
  }&cu=INR&tn=${encodeURIComponent(note)}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(upiLink, { width: 220, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [upiLink]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpiPaymentFormValues>({ resolver: zodResolver(upiPaymentSchema) });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a locally generated data: URL, not a remote image
          <img src={qrDataUrl} alt="UPI payment QR code" className="h-full w-full" />
        ) : (
          <p className="text-xs text-slate-400">Generating QR code…</p>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs text-slate-500">Scan with any UPI app, or pay to</p>
        <p className="text-sm font-medium text-slate-900">{UPI_MERCHANT_VPA}</p>
      </div>

      <form onSubmit={handleSubmit((values) => onConfirm(values.transactionRef))} className="w-full">
        <Input
          label="UPI Transaction / UTR Number"
          placeholder="Enter after the patient completes the payment"
          error={errors.transactionRef?.message}
          {...register('transactionRef')}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-3 w-full">
          Confirm UPI Payment
        </Button>
      </form>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function CardPanel({
  isSubmitting,
  onConfirm,
}: {
  isSubmitting: boolean;
  onConfirm: (reference: string) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardPaymentFormValues>({ resolver: zodResolver(cardPaymentSchema) });

  function onSubmit(values: CardPaymentFormValues) {
    const digits = values.cardNumber.replace(/\s+/g, '');
    const reference = `${cardBrand(digits)} •••• ${digits.slice(-4)}`;
    // Simulate the brief round-trip a real card terminal/gateway would take -
    // this app has no live payment gateway integration, so this is the
    // explicit "processing" step before the bill is ever marked paid. Only
    // the masked reference below is ever sent to the backend; the full card
    // number and CVV never leave this form.
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm(reference);
    }, 1200);
  }

  const busy = isProcessing || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
      <Input label="Cardholder Name" error={errors.cardholderName?.message} {...register('cardholderName')} />
      <Input
        label="Card Number"
        inputMode="numeric"
        placeholder="4111 1111 1111 1111"
        maxLength={23}
        error={errors.cardNumber?.message}
        {...register('cardNumber')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Expiry (MM/YY)" placeholder="12/28" maxLength={5} error={errors.expiry?.message} {...register('expiry')} />
        <Input label="CVV" inputMode="numeric" maxLength={4} error={errors.cvv?.message} {...register('cvv')} />
      </div>
      <p className="text-xs text-slate-400">
        Card details stay on this screen - only a masked reference (e.g. &quot;Visa •••• 4242&quot;) is saved with the
        payment record.
      </p>
      <Button type="submit" isLoading={busy} className="mt-1">
        {isProcessing ? 'Processing Payment…' : 'Process Payment'}
      </Button>
    </form>
  );
}
