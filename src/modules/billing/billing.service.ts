import { billingRepository } from './billing.repository';
import { BillingRecord, BillingStatus, CreateBillingRecordInput } from './billing.types';
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

  async markPaid(id: number): Promise<BillingRecord> {
    const record = await billingRepository.findById(id);
    if (!record) {
      throw ApiError.notFound('Billing record not found');
    }
    if (record.status === BillingStatus.PAID) {
      throw ApiError.badRequest('This billing record has already been paid');
    }
    const updated = await billingRepository.markPaid(id);
    await journeyEventRepository.record(record.patientId, 'BILLING_COMPLETED', 'Billing completed', record.appointmentId);
    return updated!;
  },
};
