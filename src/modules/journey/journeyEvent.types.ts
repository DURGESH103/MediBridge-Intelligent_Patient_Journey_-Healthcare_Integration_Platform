export type JourneyEventType =
  | 'REGISTRATION'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'CHECKED_IN'
  | 'CONSULTATION_STARTED'
  | 'CONSULTATION_COMPLETED'
  | 'LAB_TEST_REQUESTED'
  | 'LAB_REPORT_READY';

export interface JourneyEvent {
  id: number;
  patientId: number;
  appointmentId: number | null;
  eventType: JourneyEventType;
  description: string;
  occurredAt: Date;
}
