import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool, query } from '../../config/database';
import { CreatePatientInput, Patient, UpdatePatientInput } from './patients.types';

interface PatientRow extends RowDataPacket {
  id: number;
  user_id: number | null;
  patient_code: string;
  full_name: string;
  date_of_birth: string;
  gender: Patient['gender'];
  phone: string;
  email: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  registered_at: Date;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: PatientRow): Patient {
  return {
    id: row.id,
    userId: row.user_id,
    patientCode: row.patient_code,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    registeredAt: row.registered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const patientsRepository = {
  async findById(id: number): Promise<Patient | null> {
    const rows = await query<PatientRow[]>('SELECT * FROM patients WHERE id = :id LIMIT 1', { id });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findByUserId(userId: number): Promise<Patient | null> {
    const rows = await query<PatientRow[]>('SELECT * FROM patients WHERE user_id = :userId LIMIT 1', {
      userId,
    });
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findPotentialDuplicate(phone: string, dateOfBirth: string): Promise<Patient | null> {
    const rows = await query<PatientRow[]>(
      'SELECT * FROM patients WHERE phone = :phone AND date_of_birth = :dateOfBirth LIMIT 1',
      { phone, dateOfBirth }
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(input: CreatePatientInput): Promise<Patient> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO patients
          (user_id, patient_code, full_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone)
         VALUES
          (:userId, '', :fullName, :dateOfBirth, :gender, :phone, :email, :address, :emergencyContactName, :emergencyContactPhone)`,
        {
          userId: input.userId ?? null,
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          phone: input.phone,
          email: input.email ?? null,
          address: input.address ?? null,
          emergencyContactName: input.emergencyContactName ?? null,
          emergencyContactPhone: input.emergencyContactPhone ?? null,
        } as never
      );

      const patientCode = `MB-${String(result.insertId).padStart(6, '0')}`;
      await connection.query(
        'UPDATE patients SET patient_code = :patientCode WHERE id = :id',
        { patientCode, id: result.insertId } as never
      );

      const [rows] = await connection.query<PatientRow[]>('SELECT * FROM patients WHERE id = :id', {
        id: result.insertId,
      } as never);

      await connection.commit();
      return mapRow(rows[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async update(id: number, input: UpdatePatientInput): Promise<Patient | null> {
    const fields: string[] = [];
    const params: Record<string, unknown> = { id };

    const fieldMap: Record<string, string> = {
      fullName: 'full_name',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      phone: 'phone',
      email: 'email',
      address: 'address',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
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

    await query(`UPDATE patients SET ${fields.join(', ')} WHERE id = :id`, params);
    return this.findById(id);
  },

  async search(term: string, limit: number, offset: number): Promise<Patient[]> {
    const likeTerm = `%${term}%`;
    const rows = await query<PatientRow[]>(
      `SELECT * FROM patients
       WHERE full_name LIKE :likeTerm OR phone LIKE :likeTerm OR patient_code LIKE :likeTerm
       ORDER BY created_at DESC
       LIMIT :limit OFFSET :offset`,
      { likeTerm, limit, offset }
    );
    return rows.map(mapRow);
  },

  async count(): Promise<number> {
    const rows = await query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM patients', {});
    return Number(rows[0].count);
  },
};
