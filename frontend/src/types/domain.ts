export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Patient {
  id: number;
  userId: number | null;
  patientCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: number;
  userId: number;
  departmentId: number;
  fullName: string;
  specialization: string;
  qualification: string | null;
  phone: string | null;
  consultationFee: number | null;
  averageConsultationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailability {
  id: number;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type QueueStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';

export interface QueueEntry {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  queueDate: string;
  tokenNumber: number;
  status: QueueStatus;
  checkedInAt: string;
  calledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export type ConsultationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Consultation {
  id: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  status: ConsultationStatus;
  diagnosis: string | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: number;
  consultationId: number;
  medicineName: string;
  dosage: string;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  createdAt: string;
}

export type LabTestStatus = 'REQUESTED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED';

export interface LabTestRequest {
  id: number;
  consultationId: number;
  patientId: number;
  testName: string;
  status: LabTestStatus;
  requestedAt: string;
  sampleCollectedAt: string | null;
  processingStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabReport {
  id: number;
  labTestRequestId: number;
  resultSummary: string;
  reportFileUrl: string | null;
  completedAt: string;
  createdAt: string;
}

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
export type OverallJourneyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface JourneyStage {
  id: JourneyStageId;
  label: string;
  status: JourneyStageStatus;
}

export interface JourneyEvent {
  id: number;
  patientId: number;
  appointmentId: number | null;
  eventType: string;
  description: string;
  occurredAt: string;
}

export interface PatientJourney {
  patientId: number;
  appointmentId: number;
  overallStatus: OverallJourneyStatus;
  currentStage: JourneyStageId | null;
  stages: JourneyStage[];
  nextAction: string;
  timeline: JourneyEvent[];
}

export type BillingStatus = 'PENDING' | 'PAID';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

export interface BillingRecord {
  id: number;
  patientId: number;
  appointmentId: number;
  consultationId: number;
  amount: number | null;
  status: BillingStatus;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'APPOINTMENT_CONFIRMATION'
  | 'APPOINTMENT_REMINDER'
  | 'QUEUE_UPDATE'
  | 'LAB_REPORT_READY'
  | 'GENERAL';

export interface AppNotification {
  id: number;
  userId: number;
  type: NotificationType;
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
