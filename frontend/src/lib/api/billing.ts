import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { BillingRecord, PaymentMethod } from '@/types/domain';

export async function listPendingBilling(): Promise<BillingRecord[]> {
  const res = await apiClient.get<ApiSuccess<BillingRecord[]>>('/billing/pending');
  return res.data.data;
}

export async function listCompletedBilling(): Promise<BillingRecord[]> {
  const res = await apiClient.get<ApiSuccess<BillingRecord[]>>('/billing/completed');
  return res.data.data;
}

export async function listBillingForPatient(patientId: number): Promise<BillingRecord[]> {
  const res = await apiClient.get<ApiSuccess<BillingRecord[]>>(`/billing/patients/${patientId}`);
  return res.data.data;
}

export async function markBillingPaid(
  id: number,
  paymentMethod: PaymentMethod,
  paymentReference?: string
): Promise<BillingRecord> {
  const res = await apiClient.patch<ApiSuccess<BillingRecord>>(`/billing/${id}/mark-paid`, {
    paymentMethod,
    paymentReference,
  });
  return res.data.data;
}
