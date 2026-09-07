import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { Consultation, ConsultationStatus, CreatePrescriptionInput, Prescription } from './consultation.types';

interface ConsultationRow extends RowDataPacket {
  id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  status: ConsultationStatus;
  diagnosis: string | null;
  notes: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface PrescriptionRow extends RowDataPacket {
  id: number;
  consultation_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  created_at: Date;
}

function mapConsultation(row: ConsultationRow): Consultation {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    status: row.status,
    diagnosis: row.diagnosis,
    notes: row.notes,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPrescription(row: PrescriptionRow): Prescription {
  return {
    id: row.id,
    consultationId: row.consultation_id,
    medicineName: row.medicine_name,
    dosage: row.dosage,
    frequency: row.frequency,
    duration: row.duration,
    instructions: row.instructions,
    createdAt: row.created_at,
  };
}

export const consultationRepository = {
  async findById(id: number): Promise<Consultation | null> {
    const rows = await query<ConsultationRow[]>('SELECT * FROM consultations WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapConsultation(rows[0]) : null;
  },

  async findByAppointmentId(appointmentId: number): Promise<Consultation | null> {
    const rows = await query<ConsultationRow[]>(
      'SELECT * FROM consultations WHERE appointment_id = :appointmentId LIMIT 1',
      { appointmentId }
    );
    return rows[0] ? mapConsultation(rows[0]) : null;
  },

  async create(input: { appointmentId: number; patientId: number; doctorId: number }): Promise<Consultation> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO consultations (appointment_id, patient_id, doctor_id, status, started_at)
       VALUES (:appointmentId, :patientId, :doctorId, 'IN_PROGRESS', NOW())`,
      input
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load consultation immediately after creation');
    }
    return created;
  },

  async updateNotes(id: number, diagnosis?: string | null, notes?: string | null): Promise<Consultation | null> {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id };

    if (diagnosis !== undefined) {
      fields.push('diagnosis = :diagnosis');
      params.diagnosis = diagnosis;
    }
    if (notes !== undefined) {
      fields.push('notes = :notes');
      params.notes = notes;
    }
    if (fields.length === 0) {
      return this.findById(id);
    }

    await query(`UPDATE consultations SET ${fields.join(', ')} WHERE id = :id`, params);
    return this.findById(id);
  },

  async complete(id: number): Promise<Consultation | null> {
    await query(
      `UPDATE consultations SET status = 'COMPLETED', completed_at = NOW() WHERE id = :id`,
      { id }
    );
    return this.findById(id);
  },

  async findByPatient(patientId: number): Promise<Consultation[]> {
    const rows = await query<ConsultationRow[]>(
      'SELECT * FROM consultations WHERE patient_id = :patientId ORDER BY created_at DESC',
      { patientId }
    );
    return rows.map(mapConsultation);
  },

  async addPrescription(consultationId: number, input: CreatePrescriptionInput): Promise<Prescription> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO prescriptions (consultation_id, medicine_name, dosage, frequency, duration, instructions)
       VALUES (:consultationId, :medicineName, :dosage, :frequency, :duration, :instructions)`,
      {
        consultationId,
        medicineName: input.medicineName,
        dosage: input.dosage,
        frequency: input.frequency ?? null,
        duration: input.duration ?? null,
        instructions: input.instructions ?? null,
      }
    );
    const rows = await query<PrescriptionRow[]>('SELECT * FROM prescriptions WHERE id = :id', {
      id: result.insertId,
    });
    return mapPrescription(rows[0]);
  },

  async getPrescriptions(consultationId: number): Promise<Prescription[]> {
    const rows = await query<PrescriptionRow[]>(
      'SELECT * FROM prescriptions WHERE consultation_id = :consultationId ORDER BY created_at ASC',
      { consultationId }
    );
    return rows.map(mapPrescription);
  },
};
