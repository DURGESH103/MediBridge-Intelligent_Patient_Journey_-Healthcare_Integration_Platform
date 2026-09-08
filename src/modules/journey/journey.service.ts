import { appointmentRepository } from '../appointments/appointment.repository';
import { AppointmentStatus } from '../appointments/appointment.types';
import { queueRepository } from '../queue/queue.repository';
import { QueueStatus } from '../queue/queue.types';
import { consultationRepository } from '../consultations/consultation.repository';
import { ConsultationStatus } from '../consultations/consultation.types';
import { labRepository } from '../laboratory/lab.repository';
import { LabTestRequest, LabTestStatus } from '../laboratory/lab.types';
import { billingRepository } from '../billing/billing.repository';
import { BillingStatus } from '../billing/billing.types';
import { journeyEventRepository } from './journeyEvent.repository';
import { JourneyStage, JourneyStageId, PatientJourney } from './journey.types';
import { ApiError } from '../../utils/ApiError';

interface StageDefinition {
  id: JourneyStageId;
  label: string;
  done: boolean;
  applicable: boolean;
}

function buildNextAction(
  stageId: JourneyStageId | null,
  context: { queueEntry: Awaited<ReturnType<typeof queueRepository.findByAppointmentId>>; pendingLabRequest?: LabTestRequest }
): string {
  if (stageId === null) {
    return 'Your visit is complete. Please proceed to billing if you have not already done so.';
  }

  if (context.queueEntry?.status === QueueStatus.SKIPPED) {
    return 'You were skipped in the queue. Please speak with the reception desk.';
  }
  if (context.queueEntry?.status === QueueStatus.CANCELLED) {
    return 'Your queue entry was cancelled. Please speak with the reception desk.';
  }

  switch (stageId) {
    case 'CHECK_IN':
      return 'Please check in at the reception desk when you arrive for your appointment.';
    case 'QUEUE':
      return context.queueEntry
        ? `You are token #${context.queueEntry.tokenNumber}. Please wait to be called.`
        : 'Please wait to be checked in.';
    case 'CONSULTATION':
      return 'Please wait to be called in for your consultation.';
    case 'PRESCRIPTION':
      return 'Please wait while your doctor finalizes your prescription.';
    case 'LABORATORY': {
      const pending = context.pendingLabRequest;
      if (!pending || pending.status === LabTestStatus.REQUESTED) {
        return 'Please proceed to the laboratory for sample collection.';
      }
      return 'Your sample is being processed. Please wait for your report to be ready.';
    }
    case 'BILLING':
      return 'Please proceed to billing to complete your visit.';
    case 'COMPLETED':
      return 'Your visit is complete.';
    default:
      return 'Please wait for further instructions.';
  }
}

export const journeyService = {
  async getJourneyForAppointment(appointmentId: number): Promise<PatientJourney> {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw ApiError.notFound('Appointment not found');
    }

    const timeline = await journeyEventRepository.findByAppointment(appointmentId);

    if (appointment.status === AppointmentStatus.CANCELLED || appointment.status === AppointmentStatus.NO_SHOW) {
      const stages: JourneyStage[] = [
        { id: 'REGISTRATION', label: 'Registration Complete', status: 'COMPLETED' },
        {
          id: 'APPOINTMENT',
          label: 'Appointment Confirmed',
          status: appointment.status === AppointmentStatus.NO_SHOW ? 'COMPLETED' : 'SKIPPED',
        },
      ];
      return {
        patientId: appointment.patientId,
        appointmentId,
        overallStatus: appointment.status === AppointmentStatus.CANCELLED ? 'CANCELLED' : 'NO_SHOW',
        currentStage: null,
        stages,
        nextAction:
          appointment.status === AppointmentStatus.CANCELLED
            ? 'This appointment was cancelled.'
            : 'This appointment was marked as a no-show.',
        timeline,
      };
    }

    const queueEntry = await queueRepository.findByAppointmentId(appointmentId);
    const consultation = await consultationRepository.findByAppointmentId(appointmentId);
    const labRequests = consultation ? await labRepository.findByConsultationId(consultation.id) : [];
    const prescriptions = consultation ? await consultationRepository.getPrescriptions(consultation.id) : [];
    const billingRecord = consultation ? await billingRepository.findByConsultationId(consultation.id) : null;

    const hasLabs = labRequests.length > 0;
    const allLabsComplete = hasLabs && labRequests.every((request) => request.status === LabTestStatus.COMPLETED);
    const hasPrescriptions = prescriptions.length > 0;

    const checkInDone = Boolean(queueEntry);
    const consultationDone = consultation?.status === ConsultationStatus.COMPLETED;
    // A consultation can only ever exist once the patient has actually been
    // called in, regardless of what the queue_entries row itself says (a
    // doctor can start a consultation straight from the Consultations list
    // without going through Call Next first) - so "has a consultation been
    // started" is a stronger, always-correct signal than the queue entry's
    // own status alone. This also self-heals any appointment whose queue
    // entry was already left stuck at WAITING by that gap before this fix.
    const queueDone =
      Boolean(consultation) ||
      (Boolean(queueEntry) &&
        (queueEntry!.status === QueueStatus.IN_PROGRESS || queueEntry!.status === QueueStatus.COMPLETED));
    const prescriptionDone = Boolean(consultationDone) && hasPrescriptions;
    const laboratoryDone = !hasLabs || allLabsComplete;
    const billingDone = billingRecord?.status === BillingStatus.PAID;
    const overallDone = appointment.status === AppointmentStatus.COMPLETED && laboratoryDone && billingDone;

    const stageDefinitions: StageDefinition[] = [
      { id: 'REGISTRATION', label: 'Registration Complete', done: true, applicable: true },
      { id: 'APPOINTMENT', label: 'Appointment Confirmed', done: true, applicable: true },
      { id: 'CHECK_IN', label: 'Hospital Check-In', done: checkInDone, applicable: true },
      { id: 'QUEUE', label: 'Waiting for Doctor', done: queueDone, applicable: true },
      { id: 'CONSULTATION', label: 'Consultation', done: Boolean(consultationDone), applicable: true },
      { id: 'PRESCRIPTION', label: 'Prescription', done: prescriptionDone, applicable: hasPrescriptions },
      { id: 'LABORATORY', label: 'Laboratory Test & Report', done: laboratoryDone, applicable: hasLabs },
      { id: 'BILLING', label: 'Billing', done: billingDone, applicable: true },
      { id: 'COMPLETED', label: 'Completed', done: overallDone, applicable: true },
    ];

    const stages: JourneyStage[] = [];
    let currentStage: JourneyStageId | null = null;
    let currentFound = false;

    for (const def of stageDefinitions) {
      if (!def.applicable) {
        stages.push({ id: def.id, label: def.label, status: 'SKIPPED' });
        continue;
      }
      if (def.done) {
        stages.push({ id: def.id, label: def.label, status: 'COMPLETED' });
      } else if (!currentFound) {
        stages.push({ id: def.id, label: def.label, status: 'CURRENT' });
        currentStage = def.id;
        currentFound = true;
      } else {
        stages.push({ id: def.id, label: def.label, status: 'PENDING' });
      }
    }

    const pendingLabRequest = labRequests.find((request) => request.status !== LabTestStatus.COMPLETED);
    const nextAction = buildNextAction(currentStage, { queueEntry, pendingLabRequest });

    return {
      patientId: appointment.patientId,
      appointmentId,
      overallStatus: overallDone ? 'COMPLETED' : 'IN_PROGRESS',
      currentStage,
      stages,
      nextAction,
      timeline,
    };
  },

  async getCurrentJourneyForPatient(patientId: number): Promise<PatientJourney> {
    const appointments = await appointmentRepository.findMany({ patientId });
    if (appointments.length === 0) {
      throw ApiError.notFound('This patient has no appointments yet');
    }

    const active = appointments.find((appointment) => appointment.status === AppointmentStatus.CHECKED_IN);
    const target = active ?? appointments[0];

    return this.getJourneyForAppointment(target.id);
  },

  async getTimelineForPatient(patientId: number) {
    return journeyEventRepository.findByPatient(patientId);
  },
};
