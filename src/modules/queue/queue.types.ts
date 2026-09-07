export enum QueueStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
}

export interface QueueEntry {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  queueDate: string;
  tokenNumber: number;
  status: QueueStatus;
  checkedInAt: Date;
  calledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueStatusSummary {
  doctorId: number;
  queueDate: string;
  currentlyServingToken: number | null;
  totalWaiting: number;
  yourEntry?: {
    tokenNumber: number;
    status: QueueStatus;
    patientsAhead: number;
    estimatedWaitMinutes: number;
  };
}
