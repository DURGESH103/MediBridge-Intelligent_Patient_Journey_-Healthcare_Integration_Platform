import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { Consultation, ConsultationStatus, CreatePrescriptionInput, Prescription, PrescriptionWithContext } from './consultation.types';

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

interface PrescriptionWithContextRow extends RowDataPacket {
  id: number;
  consultation_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
  created_at: Date;
  // consultation
  diagnosis: string | null;
  consultation_notes: string | null;
  consultation_started_at: Date | null;
  consultation_completed_at: Date | null;
  appointment_id: number;
  // doctor
  doctor_id: number;
  doctor_name: string;
  doctor_specialization: string;
  doctor_qualification: string | null;
  doctor_phone: string | null;
  department_name: string;
  // patient
  patient_name: string;
  patient_code: string;
  patient_date_of_birth: string;
  patient_gender: string;
  patient_phone: string;
  patient_email: string | null;
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

function mapPrescriptionWithContext(row: PrescriptionWithContextRow): PrescriptionWithContext {
  return {
    id: row.id,
    consultationId: row.consultation_id,
    medicineName: row.medicine_name,
    dosage: row.dosage,
    frequency: row.frequency,
    duration: row.duration,
    instructions: row.instructions,
    createdAt: row.created_at,
    // consultation
    diagnosis: row.diagnosis,
    consultationNotes: row.consultation_notes,
    consultationStartedAt: row.consultation_started_at,
    consultationCompletedAt: row.consultation_completed_at,
    appointmentId: row.appointment_id,
    // doctor
    doctorId: row.doctor_id,
    doctorName: row.doctor_name,
    doctorSpecialization: row.doctor_specialization,
    doctorQualification: row.doctor_qualification,
    doctorPhone: row.doctor_phone,
    departmentName: row.department_name,
    // patient
    patientName: row.patient_name,
    patientCode: row.patient_code,
    patientDateOfBirth: row.patient_date_of_birth,
    patientGender: row.patient_gender,
    patientPhone: row.patient_phone,
    patientEmail: row.patient_email,
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

  async getPrescriptionsForPatient(patientId: number): Promise<PrescriptionWithContext[]> {
    const rows = await query<PrescriptionWithContextRow[]>(
      `SELECT
         p.id, p.consultation_id, p.medicine_name, p.dosage,
         p.frequency, p.duration, p.instructions, p.created_at,
         c.diagnosis, c.notes AS consultation_notes,
         c.started_at AS consultation_started_at,
         c.completed_at AS consultation_completed_at,
         c.appointment_id,
         d.id AS doctor_id, d.full_name AS doctor_name,
         d.specialization AS doctor_specialization,
         d.qualification AS doctor_qualification,
         d.phone AS doctor_phone,
         dep.name AS department_name,
         pat.full_name AS patient_name, pat.patient_code,
         pat.date_of_birth AS patient_date_of_birth,
         pat.gender AS patient_gender,
         pat.phone AS patient_phone,
         pat.email AS patient_email
       FROM prescriptions p
       JOIN consultations c ON c.id = p.consultation_id
       JOIN doctors d ON d.id = c.doctor_id
       JOIN departments dep ON dep.id = d.department_id
       JOIN patients pat ON pat.id = c.patient_id
       WHERE c.patient_id = :patientId
       ORDER BY p.created_at DESC`,
      { patientId }
    );
    return rows.map(mapPrescriptionWithContext);
  },
};
