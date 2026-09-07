export enum BillingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface BillingRecord {
  id: number;
  patientId: number;
  appointmentId: number;
  consultationId: number;
  amount: number | null;
  status: BillingStatus;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBillingRecordInput {
  patientId: number;
  appointmentId: number;
  consultationId: number;
  amount: number | null;
}
