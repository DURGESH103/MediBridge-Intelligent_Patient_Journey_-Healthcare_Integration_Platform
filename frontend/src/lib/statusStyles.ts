import type { StatusTone } from '@/components/ui/StatusBadge';
import type {
  AppointmentStatus,
  ConsultationStatus,
  JourneyStageStatus,
  LabTestStatus,
  QueueStatus,
} from '@/types/domain';

const TITLE_CASE_WORD = /_/g;

function toTitleCase(status: string): string {
  return status.replace(TITLE_CASE_WORD, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function appointmentStatusStyle(status: AppointmentStatus): { label: string; tone: StatusTone } {
  const tones: Record<AppointmentStatus, StatusTone> = {
    SCHEDULED: 'neutral',
    CONFIRMED: 'info',
    CHECKED_IN: 'info',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    NO_SHOW: 'warning',
  };
  return { label: toTitleCase(status), tone: tones[status] };
}

export function queueStatusStyle(status: QueueStatus): { label: string; tone: StatusTone } {
  const tones: Record<QueueStatus, StatusTone> = {
    WAITING: 'neutral',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    SKIPPED: 'warning',
    CANCELLED: 'danger',
  };
  return { label: toTitleCase(status), tone: tones[status] };
}

export function consultationStatusStyle(status: ConsultationStatus): { label: string; tone: StatusTone } {
  const tones: Record<ConsultationStatus, StatusTone> = {
    NOT_STARTED: 'neutral',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
  };
  return { label: toTitleCase(status), tone: tones[status] };
}

export function labTestStatusStyle(status: LabTestStatus): { label: string; tone: StatusTone } {
  const tones: Record<LabTestStatus, StatusTone> = {
    REQUESTED: 'neutral',
    SAMPLE_COLLECTED: 'info',
    PROCESSING: 'warning',
    COMPLETED: 'success',
  };
  return { label: toTitleCase(status), tone: tones[status] };
}

export function journeyStageStyle(status: JourneyStageStatus): { tone: StatusTone } {
  const tones: Record<JourneyStageStatus, StatusTone> = {
    COMPLETED: 'success',
    CURRENT: 'info',
    PENDING: 'neutral',
    SKIPPED: 'neutral',
  };
  return { tone: tones[status] };
}
