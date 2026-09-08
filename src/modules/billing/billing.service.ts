import { billingRepository } from './billing.repository';
import { BillingRecord, BillingStatus, CreateBillingRecordInput, PaymentMethod } from './billing.types';
import { journeyEventRepository } from '../journey/journeyEvent.repository';
import { ApiError } from '../../utils/ApiError';

export const billingService = {
  /** Idempotent: a consultation can only ever have one billing record. */
  async createForConsultation(input: CreateBillingRecordInput): Promise<BillingRecord> {
    const existing = await billingRepository.findByConsultationId(input.consultationId);
    if (existing) {
      return existing;
    }
    const record = await billingRepository.create(input);
    await journeyEventRepository.record(
      input.patientId,
      'BILLING_PENDING',
      'Billing created for this visit',
      input.appointmentId
    );
    return record;
  },

  async listPending(): Promise<BillingRecord[]> {
    return billingRepository.findByStatus(BillingStatus.PENDING);
  },

  async listCompleted(): Promise<BillingRecord[]> {
    return billingRepository.findByStatus(BillingStatus.PAID);
  },

  async listForPatient(patientId: number): Promise<BillingRecord[]> {
    return billingRepository.findByPatientId(patientId);
  },

  async markPaid(id: number, paymentMethod: PaymentMethod, paymentReference: string | null): Promise<BillingRecord> {
    const record = await billingRepository.findById(id);
    if (!record) {
      throw ApiError.notFound('Billing record not found');
    }
    if (record.status === BillingStatus.PAID) {
      throw ApiError.badRequest('This billing record has already been paid');
    }
    // Cash is confirmed by the staff member handing it over - no reference
    // needed. UPI/card payments must carry proof the payment step actually
    // ran (a transaction id / masked card summary) before we accept them as
    // paid; this is the server-side half of "only mark paid after
    // successful payment processing", not just a UI-only gate.
    if (paymentMethod !== PaymentMethod.CASH && !paymentReference) {
      throw ApiError.badRequest('A payment reference is required for this payment method');
    }
    const updated = await billingRepository.markPaid(id, paymentMethod, paymentReference);
    await journeyEventRepository.record(
      record.patientId,
      'BILLING_COMPLETED',
      `Billing completed via ${paymentMethod}`,
      record.appointmentId
    );
    return updated!;
  },
};
