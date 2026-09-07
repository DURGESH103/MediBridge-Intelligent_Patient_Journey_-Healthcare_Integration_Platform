export enum LabTestStatus {
  REQUESTED = 'REQUESTED',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

export interface LabTestRequest {
  id: number;
  consultationId: number;
  patientId: number;
  testName: string;
  status: LabTestStatus;
  requestedAt: Date;
  sampleCollectedAt: Date | null;
  processingStartedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabReport {
  id: number;
  labTestRequestId: number;
  resultSummary: string;
  reportFileUrl: string | null;
  completedAt: Date;
  createdAt: Date;
}
