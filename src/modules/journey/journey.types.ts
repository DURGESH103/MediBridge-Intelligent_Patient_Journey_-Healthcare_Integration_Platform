import { JourneyEvent } from './journeyEvent.types';

export type JourneyStageId =
  | 'REGISTRATION'
  | 'APPOINTMENT'
  | 'CHECK_IN'
  | 'QUEUE'
  | 'CONSULTATION'
  | 'PRESCRIPTION'
  | 'LABORATORY'
  | 'BILLING'
  | 'COMPLETED';

export type JourneyStageStatus = 'COMPLETED' | 'CURRENT' | 'PENDING' | 'SKIPPED';

export interface JourneyStage {
  id: JourneyStageId;
  label: string;
  status: JourneyStageStatus;
}

export type OverallJourneyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface PatientJourney {
  patientId: number;
  appointmentId: number;
  overallStatus: OverallJourneyStatus;
  currentStage: JourneyStageId | null;
  stages: JourneyStage[];
  nextAction: string;
  timeline: JourneyEvent[];
}
