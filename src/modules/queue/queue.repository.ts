import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { QueueEntry, QueueStatus } from './queue.types';

interface QueueEntryRow extends RowDataPacket {
  id: number;
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  queue_date: string;
  token_number: number;
  status: QueueStatus;
  checked_in_at: Date;
  called_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: QueueEntryRow): QueueEntry {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    queueDate: row.queue_date,
    tokenNumber: row.token_number,
    status: row.status,
    checkedInAt: row.checked_in_at,
    calledAt: row.called_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ACTIVE_STATUSES = ['WAITING', 'IN_PROGRESS'];

export const queueRepository = {
  async findById(id: number): Promise<QueueEntry | null> {
    const rows = await query<QueueEntryRow[]>('SELECT * FROM queue_entries WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByAppointmentId(appointmentId: number): Promise<QueueEntry | null> {
    const rows = await query<QueueEntryRow[]>(
      'SELECT * FROM queue_entries WHERE appointment_id = :appointmentId LIMIT 1',
      { appointmentId }
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(input: {
    appointmentId: number;
    patientId: number;
    doctorId: number;
    queueDate: string;
    tokenNumber: number;
  }): Promise<QueueEntry> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO queue_entries (appointment_id, patient_id, doctor_id, queue_date, token_number)
       VALUES (:appointmentId, :patientId, :doctorId, :queueDate, :tokenNumber)`,
      input
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load queue entry immediately after creation');
    }
    return created;
  },

  async findForDoctorAndDate(doctorId: number, queueDate: string): Promise<QueueEntry[]> {
    const rows = await query<QueueEntryRow[]>(
      `SELECT * FROM queue_entries
       WHERE doctor_id = :doctorId AND queue_date = :queueDate
       ORDER BY token_number ASC`,
      { doctorId, queueDate }
    );
    return rows.map(mapRow);
  },

  async findCurrentlyServing(doctorId: number, queueDate: string): Promise<QueueEntry | null> {
    const rows = await query<QueueEntryRow[]>(
      `SELECT * FROM queue_entries
       WHERE doctor_id = :doctorId AND queue_date = :queueDate AND status = 'IN_PROGRESS'
       LIMIT 1`,
      { doctorId, queueDate }
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findNextWaiting(doctorId: number, queueDate: string): Promise<QueueEntry | null> {
    const rows = await query<QueueEntryRow[]>(
      `SELECT * FROM queue_entries
       WHERE doctor_id = :doctorId AND queue_date = :queueDate AND status = 'WAITING'
       ORDER BY token_number ASC
       LIMIT 1`,
      { doctorId, queueDate }
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async countWaitingAhead(doctorId: number, queueDate: string, tokenNumber: number): Promise<number> {
    const rows = await query<RowDataPacket[]>(
      `SELECT COUNT(*) AS count FROM queue_entries
       WHERE doctor_id = :doctorId AND queue_date = :queueDate AND status = 'WAITING' AND token_number < :tokenNumber`,
      { doctorId, queueDate, tokenNumber }
    );
    return Number(rows[0].count);
  },

  async hasActiveEntryForPatient(patientId: number, doctorId: number, queueDate: string): Promise<boolean> {
    const rows = await query<RowDataPacket[]>(
      `SELECT id FROM queue_entries
       WHERE patient_id = :patientId AND doctor_id = :doctorId AND queue_date = :queueDate
         AND status IN (${ACTIVE_STATUSES.map((s) => `'${s}'`).join(',')})
       LIMIT 1`,
      { patientId, doctorId, queueDate }
    );
    return rows.length > 0;
  },

  async updateStatus(
    id: number,
    status: QueueStatus,
    timestamps: { calledAt?: Date; completedAt?: Date } = {}
  ): Promise<QueueEntry | null> {
    const fields = ['status = :status'];
    const params: Record<string, unknown> = { id, status };

    if (timestamps.calledAt) {
      fields.push('called_at = :calledAt');
      params.calledAt = timestamps.calledAt;
    }
    if (timestamps.completedAt) {
      fields.push('completed_at = :completedAt');
      params.completedAt = timestamps.completedAt;
    }

    await query(`UPDATE queue_entries SET ${fields.join(', ')} WHERE id = :id`, params);
    return this.findById(id);
  },
};
