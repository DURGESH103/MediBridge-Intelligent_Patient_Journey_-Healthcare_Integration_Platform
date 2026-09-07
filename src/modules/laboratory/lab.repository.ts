import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { LabReport, LabTestRequest, LabTestStatus } from './lab.types';

interface LabTestRequestRow extends RowDataPacket {
  id: number;
  consultation_id: number;
  patient_id: number;
  test_name: string;
  status: LabTestStatus;
  requested_at: Date;
  sample_collected_at: Date | null;
  processing_started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface LabReportRow extends RowDataPacket {
  id: number;
  lab_test_request_id: number;
  result_summary: string;
  report_file_url: string | null;
  completed_at: Date;
  created_at: Date;
}

function mapRequest(row: LabTestRequestRow): LabTestRequest {
  return {
    id: row.id,
    consultationId: row.consultation_id,
    patientId: row.patient_id,
    testName: row.test_name,
    status: row.status,
    requestedAt: row.requested_at,
    sampleCollectedAt: row.sample_collected_at,
    processingStartedAt: row.processing_started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReport(row: LabReportRow): LabReport {
  return {
    id: row.id,
    labTestRequestId: row.lab_test_request_id,
    resultSummary: row.result_summary,
    reportFileUrl: row.report_file_url,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

export const labRepository = {
  async findById(id: number): Promise<LabTestRequest | null> {
    const rows = await query<LabTestRequestRow[]>('SELECT * FROM lab_test_requests WHERE id = :id LIMIT 1', {
      id,
    });
    return rows[0] ? mapRequest(rows[0]) : null;
  },

  async create(input: { consultationId: number; patientId: number; testName: string }): Promise<LabTestRequest> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO lab_test_requests (consultation_id, patient_id, test_name) VALUES (:consultationId, :patientId, :testName)`,
      input
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load lab test request immediately after creation');
    }
    return created;
  },

  async findByConsultationId(consultationId: number): Promise<LabTestRequest[]> {
    const rows = await query<LabTestRequestRow[]>(
      'SELECT * FROM lab_test_requests WHERE consultation_id = :consultationId ORDER BY requested_at ASC',
      { consultationId }
    );
    return rows.map(mapRequest);
  },

  async findByPatientId(patientId: number): Promise<LabTestRequest[]> {
    const rows = await query<LabTestRequestRow[]>(
      'SELECT * FROM lab_test_requests WHERE patient_id = :patientId ORDER BY requested_at DESC',
      { patientId }
    );
    return rows.map(mapRequest);
  },

  async findPendingByStatus(status: LabTestStatus): Promise<LabTestRequest[]> {
    const rows = await query<LabTestRequestRow[]>(
      'SELECT * FROM lab_test_requests WHERE status = :status ORDER BY requested_at ASC',
      { status }
    );
    return rows.map(mapRequest);
  },

  async updateStatus(
    id: number,
    status: LabTestStatus,
    timestampColumn?: 'sample_collected_at' | 'processing_started_at' | 'completed_at'
  ): Promise<LabTestRequest | null> {
    if (timestampColumn) {
      await query(`UPDATE lab_test_requests SET status = :status, ${timestampColumn} = NOW() WHERE id = :id`, {
        id,
        status,
      });
    } else {
      await query('UPDATE lab_test_requests SET status = :status WHERE id = :id', { id, status });
    }
    return this.findById(id);
  },

  async createReport(input: {
    labTestRequestId: number;
    resultSummary: string;
    reportFileUrl?: string | null;
  }): Promise<LabReport> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO lab_reports (lab_test_request_id, result_summary, report_file_url)
       VALUES (:labTestRequestId, :resultSummary, :reportFileUrl)`,
      {
        labTestRequestId: input.labTestRequestId,
        resultSummary: input.resultSummary,
        reportFileUrl: input.reportFileUrl ?? null,
      }
    );
    const rows = await query<LabReportRow[]>('SELECT * FROM lab_reports WHERE id = :id', { id: result.insertId });
    return mapReport(rows[0]);
  },

  async findReportByRequestId(labTestRequestId: number): Promise<LabReport | null> {
    const rows = await query<LabReportRow[]>(
      'SELECT * FROM lab_reports WHERE lab_test_request_id = :labTestRequestId LIMIT 1',
      { labTestRequestId }
    );
    return rows[0] ? mapReport(rows[0]) : null;
  },
};
