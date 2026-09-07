export type JourneyEventType =
  | 'REGISTRATION'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_NO_SHOW'
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
