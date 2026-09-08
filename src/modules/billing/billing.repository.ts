import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { BillingRecord, BillingStatus, CreateBillingRecordInput, PaymentMethod } from './billing.types';

interface BillingRow extends RowDataPacket {
  id: number;
  patient_id: number;
  appointment_id: number;
  consultation_id: number;
  amount: string | null;
  status: BillingStatus;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: BillingRow): BillingRecord {
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    consultationId: row.consultation_id,
    amount: row.amount !== null ? Number(row.amount) : null,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const billingRepository = {
  async findById(id: number): Promise<BillingRecord | null> {
    const rows = await query<BillingRow[]>('SELECT * FROM billing_records WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByConsultationId(consultationId: number): Promise<BillingRecord | null> {
    const rows = await query<BillingRow[]>(
      'SELECT * FROM billing_records WHERE consultation_id = :consultationId LIMIT 1',
      { consultationId }
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(input: CreateBillingRecordInput): Promise<BillingRecord> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO billing_records (patient_id, appointment_id, consultation_id, amount)
       VALUES (:patientId, :appointmentId, :consultationId, :amount)`,
      { ...input }
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load billing record immediately after creation');
    }
    return created;
  },

  async findByStatus(status: BillingStatus): Promise<BillingRecord[]> {
    const rows = await query<BillingRow[]>(
      'SELECT * FROM billing_records WHERE status = :status ORDER BY created_at ASC',
      { status }
    );
    return rows.map(mapRow);
  },

  async findByPatientId(patientId: number): Promise<BillingRecord[]> {
    const rows = await query<BillingRow[]>(
      'SELECT * FROM billing_records WHERE patient_id = :patientId ORDER BY created_at DESC',
      { patientId }
    );
    return rows.map(mapRow);
  },

  async markPaid(id: number, paymentMethod: PaymentMethod, paymentReference: string | null): Promise<BillingRecord | null> {
    await query(
      `UPDATE billing_records
       SET status = 'PAID', payment_method = :paymentMethod, payment_reference = :paymentReference, paid_at = NOW()
       WHERE id = :id`,
      { id, paymentMethod, paymentReference }
    );
    return this.findById(id);
  },
};
