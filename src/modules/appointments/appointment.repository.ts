import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { Appointment, AppointmentFilters, AppointmentStatus, CreateAppointmentInput } from './appointment.types';

interface AppointmentRow extends RowDataPacket {
  id: number;
  patient_id: number;
  doctor_id: number;
  scheduled_at: Date;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const appointmentRepository = {
  async findById(id: number): Promise<Appointment | null> {
    const rows = await query<AppointmentRow[]>('SELECT * FROM appointments WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(input: CreateAppointmentInput & { durationMinutes: number }): Promise<Appointment> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, duration_minutes, reason)
       VALUES (:patientId, :doctorId, :scheduledAt, :durationMinutes, :reason)`,
      {
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        reason: input.reason ?? null,
      }
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load appointment immediately after creation');
    }
    return created;
  },

  async findByDoctorAndDate(doctorId: number, date: string): Promise<Appointment[]> {
    const rows = await query<AppointmentRow[]>(
      `SELECT * FROM appointments
       WHERE doctor_id = :doctorId
         AND DATE(scheduled_at) = :date
         AND status NOT IN ('CANCELLED', 'NO_SHOW')
       ORDER BY scheduled_at ASC`,
      { doctorId, date }
    );
    return rows.map(mapRow);
  },

  async findMany(filters: AppointmentFilters): Promise<Appointment[]> {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (filters.patientId) {
      conditions.push('patient_id = :patientId');
      params.patientId = filters.patientId;
    }
    if (filters.doctorId) {
      conditions.push('doctor_id = :doctorId');
      params.doctorId = filters.doctorId;
    }
    if (filters.status) {
      conditions.push('status = :status');
      params.status = filters.status;
    }
    if (filters.fromDate) {
      conditions.push('scheduled_at >= :fromDate');
      params.fromDate = filters.fromDate;
    }
    if (filters.toDate) {
      // toDate is a plain 'YYYY-MM-DD' string; comparing scheduled_at against
      // it directly would treat it as midnight and exclude the rest of that
      // day, so widen the bound to just before the following day instead.
      conditions.push('scheduled_at < DATE_ADD(:toDate, INTERVAL 1 DAY)');
      params.toDate = filters.toDate;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<AppointmentRow[]>(
      `SELECT * FROM appointments ${whereClause} ORDER BY scheduled_at DESC`,
      params
    );
    return rows.map(mapRow);
  },

  async updateStatus(id: number, status: AppointmentStatus): Promise<Appointment | null> {
    await query('UPDATE appointments SET status = :status WHERE id = :id', { id, status });
    return this.findById(id);
  },

  async reschedule(id: number, scheduledAt: string): Promise<Appointment | null> {
    await query('UPDATE appointments SET scheduled_at = :scheduledAt, status = :status WHERE id = :id', {
      id,
      scheduledAt: new Date(scheduledAt),
      status: AppointmentStatus.SCHEDULED,
    });
    return this.findById(id);
  },

  /** Appointments starting within the reminder window that haven't been reminded yet. */
  async findDueForReminder(leadMinutes: number): Promise<Appointment[]> {
    const rows = await query<AppointmentRow[]>(
      `SELECT * FROM appointments
       WHERE status IN ('SCHEDULED', 'CONFIRMED')
         AND reminder_sent_at IS NULL
         AND scheduled_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL :leadMinutes MINUTE)`,
      { leadMinutes }
    );
    return rows.map(mapRow);
  },

  async markReminderSent(id: number): Promise<void> {
    await query('UPDATE appointments SET reminder_sent_at = NOW() WHERE id = :id', { id });
  },
};
