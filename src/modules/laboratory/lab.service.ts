import { labRepository } from './lab.repository';
import { LabReport, LabTestRequest, LabTestStatus } from './lab.types';
import { consultationRepository } from '../consultations/consultation.repository';
import { journeyEventRepository } from '../journey/journeyEvent.repository';
import { patientsRepository } from '../patients/patients.repository';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.types';
import { ApiError } from '../../utils/ApiError';
import { emitLabReportReady } from '../../sockets/labEvents';

export const labService = {
  async requestTest(consultationId: number, testName: string): Promise<LabTestRequest> {
    const consultation = await consultationRepository.findById(consultationId);
    if (!consultation) {
      throw ApiError.notFound('Consultation not found');
    }
    const request = await labRepository.create({
      consultationId,
      patientId: consultation.patientId,
      testName,
    });
    await journeyEventRepository.record(
      consultation.patientId,
      'LAB_TEST_REQUESTED',
      `Laboratory test requested: ${testName}`,
      consultation.appointmentId
    );
    return request;
  },

  async getRequestById(id: number): Promise<LabTestRequest> {
    const request = await labRepository.findById(id);
    if (!request) {
      throw ApiError.notFound('Lab test request not found');
    }
    return request;
  },

  async listForConsultation(consultationId: number): Promise<LabTestRequest[]> {
    return labRepository.findByConsultationId(consultationId);
  },

  async listForPatient(patientId: number): Promise<LabTestRequest[]> {
    return labRepository.findByPatientId(patientId);
  },

  async listPendingWork(): Promise<LabTestRequest[]> {
    const [requested, sampleCollected, processing] = await Promise.all([
      labRepository.findPendingByStatus(LabTestStatus.REQUESTED),
      labRepository.findPendingByStatus(LabTestStatus.SAMPLE_COLLECTED),
      labRepository.findPendingByStatus(LabTestStatus.PROCESSING),
    ]);
    return [...requested, ...sampleCollected, ...processing];
  },

  async collectSample(id: number): Promise<LabTestRequest> {
    const request = await this.getRequestById(id);
    if (request.status !== LabTestStatus.REQUESTED) {
      throw ApiError.badRequest(`A test with status ${request.status} cannot have a sample collected`);
    }
    const updated = await labRepository.updateStatus(id, LabTestStatus.SAMPLE_COLLECTED, 'sample_collected_at');
    return updated!;
  },

  async startProcessing(id: number): Promise<LabTestRequest> {
    const request = await this.getRequestById(id);
    if (request.status !== LabTestStatus.SAMPLE_COLLECTED) {
      throw ApiError.badRequest(`A test with status ${request.status} cannot start processing`);
    }
    const updated = await labRepository.updateStatus(id, LabTestStatus.PROCESSING, 'processing_started_at');
    return updated!;
  },

  async completeTest(
    id: number,
    resultSummary: string,
    reportFileUrl?: string | null
  ): Promise<{ request: LabTestRequest; report: LabReport }> {
    const request = await this.getRequestById(id);
    if (request.status !== LabTestStatus.PROCESSING) {
      throw ApiError.badRequest(`A test with status ${request.status} cannot be completed`);
    }

    const updated = await labRepository.updateStatus(id, LabTestStatus.COMPLETED, 'completed_at');
    const report = await labRepository.createReport({
      labTestRequestId: id,
      resultSummary,
      reportFileUrl,
    });

    const consultation = await consultationRepository.findById(request.consultationId);
    await journeyEventRepository.record(
      request.patientId,
      'LAB_REPORT_READY',
      `Laboratory report ready: ${request.testName}`,
      consultation?.appointmentId ?? null
    );

    const patient = await patientsRepository.findById(request.patientId);
    if (patient?.userId) {
      await notificationService.notify(
        patient.userId,
        NotificationType.LAB_REPORT_READY,
        'Lab Report Ready',
        `Your report for ${request.testName} is ready.`
      );
    }

    emitLabReportReady(request.patientId, updated!, report);

    return { request: updated!, report };
  },

  async getReport(labTestRequestId: number): Promise<LabReport> {
    const report = await labRepository.findReportByRequestId(labTestRequestId);
    if (!report) {
      throw ApiError.notFound('Lab report not found');
    }
    return report;
  },
};
