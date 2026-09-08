export enum BillingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
}

export interface BillingRecord {
  id: number;
  patientId: number;
  appointmentId: number;
  consultationId: number;
  amount: number | null;
  status: BillingStatus;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
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
