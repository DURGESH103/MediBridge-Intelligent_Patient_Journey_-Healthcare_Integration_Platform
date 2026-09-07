import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import {
  CreateDoctorInput,
  Doctor,
  DoctorAvailability,
  SetAvailabilityInput,
  UpdateDoctorInput,
} from './doctor.types';

interface DoctorRow extends RowDataPacket {
  id: number;
  user_id: number;
  department_id: number;
  full_name: string;
  specialization: string;
  qualification: string | null;
  phone: string | null;
  consultation_fee: string | null;
  average_consultation_minutes: number;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

interface AvailabilityRow extends RowDataPacket {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

function mapDoctorRow(row: DoctorRow): Doctor {
  return {
    id: row.id,
    userId: row.user_id,
    departmentId: row.department_id,
    fullName: row.full_name,
    specialization: row.specialization,
    qualification: row.qualification,
    phone: row.phone,
    consultationFee: row.consultation_fee !== null ? Number(row.consultation_fee) : null,
    averageConsultationMinutes: row.average_consultation_minutes,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAvailabilityRow(row: AvailabilityRow): DoctorAvailability {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    slotDurationMinutes: row.slot_duration_minutes,
  };
}

export const doctorRepository = {
  async findById(id: number): Promise<Doctor | null> {
    const rows = await query<DoctorRow[]>('SELECT * FROM doctors WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapDoctorRow(rows[0]) : null;
  },

  async findByUserId(userId: number): Promise<Doctor | null> {
    const rows = await query<DoctorRow[]>('SELECT * FROM doctors WHERE user_id = :userId LIMIT 1', {
      userId,
    });
    return rows[0] ? mapDoctorRow(rows[0]) : null;
  },

  async findAll(departmentId?: number): Promise<Doctor[]> {
    if (departmentId) {
      const rows = await query<DoctorRow[]>(
        'SELECT * FROM doctors WHERE department_id = :departmentId AND is_active = TRUE ORDER BY full_name ASC',
        { departmentId }
      );
      return rows.map(mapDoctorRow);
    }
    const rows = await query<DoctorRow[]>(
      'SELECT * FROM doctors WHERE is_active = TRUE ORDER BY full_name ASC'
    );
    return rows.map(mapDoctorRow);
  },

  async create(input: CreateDoctorInput): Promise<Doctor> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO doctors
        (user_id, department_id, full_name, specialization, qualification, phone, consultation_fee, average_consultation_minutes)
       VALUES
        (:userId, :departmentId, :fullName, :specialization, :qualification, :phone, :consultationFee, :averageConsultationMinutes)`,
      {
        userId: input.userId,
        departmentId: input.departmentId,
        fullName: input.fullName,
        specialization: input.specialization,
        qualification: input.qualification ?? null,
        phone: input.phone ?? null,
        consultationFee: input.consultationFee ?? null,
        averageConsultationMinutes: input.averageConsultationMinutes ?? 15,
      }
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to load doctor immediately after creation');
    }
    return created;
  },

  async update(id: number, input: UpdateDoctorInput): Promise<Doctor | null> {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id };

    const fieldMap: Record<string, string> = {
      departmentId: 'department_id',
      fullName: 'full_name',
      specialization: 'specialization',
      qualification: 'qualification',
      phone: 'phone',
      consultationFee: 'consultation_fee',
      averageConsultationMinutes: 'average_consultation_minutes',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        fields.push(`${column} = :${key}`);
        params[key] = value;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    await query(`UPDATE doctors SET ${fields.join(', ')} WHERE id = :id`, params);
    return this.findById(id);
  },

  async getAvailability(doctorId: number): Promise<DoctorAvailability[]> {
    const rows = await query<AvailabilityRow[]>(
      'SELECT * FROM doctor_availability WHERE doctor_id = :doctorId ORDER BY day_of_week ASC, start_time ASC',
      { doctorId }
    );
    return rows.map(mapAvailabilityRow);
  },

  async getAvailabilityForDay(doctorId: number, dayOfWeek: number): Promise<DoctorAvailability[]> {
    const rows = await query<AvailabilityRow[]>(
      `SELECT * FROM doctor_availability
       WHERE doctor_id = :doctorId AND day_of_week = :dayOfWeek
       ORDER BY start_time ASC`,
      { doctorId, dayOfWeek }
    );
    return rows.map(mapAvailabilityRow);
  },

  async replaceAvailability(doctorId: number, slots: SetAvailabilityInput[]): Promise<DoctorAvailability[]> {
    await query('DELETE FROM doctor_availability WHERE doctor_id = :doctorId', { doctorId });

    for (const slot of slots) {
      await query(
        `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
         VALUES (:doctorId, :dayOfWeek, :startTime, :endTime, :slotDurationMinutes)`,
        { doctorId, ...slot }
      );
    }

    return this.getAvailability(doctorId);
  },
};
