/**
 * Seeds one demo account for each of the six roles so you can manually test
 * every role-based dashboard without touching the public registration flow.
 *
 * Safe to run multiple times — uses INSERT ... ON DUPLICATE KEY UPDATE so it
 * never creates duplicates and never deletes existing data.
 *
 * Usage:
 *   npm run db:seed-demo
 */

import { pool, query } from '../config/database';
import { hashPassword } from '../utils/password';
import { logger } from '../config/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
}

async function upsertUser(
  email: string,
  password: string,
  role: string,
  fullName: string
): Promise<number> {
  const hash = await hashPassword(password);
  // Update the hash + full_name on re-runs so the known password is always valid.
  await query<ResultSetHeader>(
    `INSERT INTO users (email, password_hash, role, full_name)
     VALUES (:email, :hash, :role, :fullName)
     ON DUPLICATE KEY UPDATE password_hash = :hash, full_name = :fullName`,
    { email, hash, role, fullName }
  );
  const rows = await query<UserRow[]>('SELECT id FROM users WHERE email = :email LIMIT 1', { email });
  return rows[0].id;
}

async function ensureDepartment(name: string): Promise<number> {
  await query<ResultSetHeader>(
    `INSERT INTO departments (name) VALUES (:name)
     ON DUPLICATE KEY UPDATE name = name`,
    { name }
  );
  const rows = await query<UserRow[]>(
    'SELECT id FROM departments WHERE name = :name LIMIT 1',
    { name }
  );
  return rows[0].id;
}

async function upsertDoctor(userId: number, departmentId: number): Promise<void> {
  await query<ResultSetHeader>(
    `INSERT INTO doctors
       (user_id, department_id, full_name, specialization, qualification, phone, consultation_fee, average_consultation_minutes)
     VALUES
       (:userId, :departmentId, 'Dr. Demo Doctor', 'General Medicine', 'MBBS', '+910000000001', 500.00, 15)
     ON DUPLICATE KEY UPDATE
       department_id = :departmentId,
       full_name = 'Dr. Demo Doctor',
       specialization = 'General Medicine'`,
    { userId, departmentId }
  );
}

async function upsertPatient(userId: number): Promise<void> {
  // Check if a patient record already exists for this user
  const rows = await query<UserRow[]>(
    'SELECT id FROM patients WHERE user_id = :userId LIMIT 1',
    { userId }
  );
  if (rows.length > 0) return;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO patients
         (user_id, patient_code, full_name, date_of_birth, gender, phone, email)
       VALUES
         (:userId, '', 'Demo Patient', '1990-06-15', 'MALE', '+910000000002', 'demo.patient@example.com')`,
      { userId } as never
    );
    const patientCode = `MB-${String(result.insertId).padStart(6, '0')}`;
    await connection.query(
      'UPDATE patients SET patient_code = :patientCode WHERE id = :id',
      { patientCode, id: result.insertId } as never
    );
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function seed(): Promise<void> {
  const PASSWORD = 'Demo@12345';

  logger.info('Seeding demo accounts (idempotent)...');

  // ADMIN — no linked record required beyond the users row
  await upsertUser('demo.admin@medibridge.local', PASSWORD, 'ADMIN', 'Demo Admin');
  logger.info('  ✓ ADMIN   demo.admin@medibridge.local');

  // RECEPTIONIST — no linked record required
  await upsertUser('demo.receptionist@medibridge.local', PASSWORD, 'RECEPTIONIST', 'Demo Receptionist');
  logger.info('  ✓ RECEPTIONIST   demo.receptionist@medibridge.local');

  // LAB_STAFF — no linked record required
  await upsertUser('demo.labstaff@medibridge.local', PASSWORD, 'LAB_STAFF', 'Demo Lab Staff');
  logger.info('  ✓ LAB_STAFF   demo.labstaff@medibridge.local');

  // BILLING_STAFF — no linked record required
  await upsertUser('demo.billing@medibridge.local', PASSWORD, 'BILLING_STAFF', 'Demo Billing Staff');
  logger.info('  ✓ BILLING_STAFF   demo.billing@medibridge.local');

  // DOCTOR — requires a department + doctors row
  const doctorUserId = await upsertUser('demo.doctor@medibridge.local', PASSWORD, 'DOCTOR', 'Dr. Demo Doctor');
  const departmentId = await ensureDepartment('Demo Department');
  await upsertDoctor(doctorUserId, departmentId);
  logger.info('  ✓ DOCTOR   demo.doctor@medibridge.local  (department: Demo Department)');

  // PATIENT — requires a patients row
  const patientUserId = await upsertUser('demo.patient@example.com', PASSWORD, 'PATIENT', 'Demo Patient');
  await upsertPatient(patientUserId);
  logger.info('  ✓ PATIENT   demo.patient@example.com');

  logger.info('');
  logger.info('All demo accounts ready. Password for every account: Demo@12345');
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
