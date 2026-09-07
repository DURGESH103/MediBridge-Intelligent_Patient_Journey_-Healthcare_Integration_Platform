import request from 'supertest';
import { createApp } from '../src/app';
import { usersRepository } from '../src/modules/users/users.repository';
import { hashPassword } from '../src/utils/password';
import { UserRole } from '../src/types/roles';

export const app = createApp();

let uniqueCounter = 0;
function unique(prefix: string): string {
  uniqueCounter += 1;
  return `${prefix}${Date.now()}${uniqueCounter}`;
}

export async function registerPatient(overrides: Partial<{
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
}> = {}) {
  const email = overrides.email ?? `${unique('patient')}@example.com`;
  const payload = {
    email,
    password: overrides.password ?? 'Passw0rd123',
    fullName: overrides.fullName ?? 'Test Patient',
    dateOfBirth: overrides.dateOfBirth ?? '1990-01-01',
    gender: overrides.gender ?? 'MALE',
    phone: overrides.phone ?? `+91${Math.floor(1000000000 + Math.random() * 899999999)}`,
  };

  const res = await request(app).post('/api/v1/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`Failed to register test patient: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.data.accessToken as string, userId: res.body.data.user.id as number, email };
}

export async function createStaffUser(role: UserRole): Promise<{ token: string; userId: number; email: string }> {
  const email = `${unique(role.toLowerCase())}@medibridge.local`;
  const password = 'StaffPass123';
  const passwordHash = await hashPassword(password);
  const user = await usersRepository.create({ email, passwordHash, role });

  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Failed to log in test staff user: ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.data.accessToken as string, userId: user.id, email };
}

export async function createDepartment(adminToken: string, name = unique('Dept-')) {
  const res = await request(app)
    .post('/api/v1/departments')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name });
  if (res.status !== 201) {
    throw new Error(`Failed to create test department: ${JSON.stringify(res.body)}`);
  }
  return res.body.data as { id: number; name: string };
}

export async function createDoctor(adminToken: string, departmentId: number) {
  const email = `${unique('doctor')}@medibridge.local`;
  const res = await request(app)
    .post('/api/v1/doctors')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      email,
      password: 'DoctorPass123',
      departmentId,
      fullName: 'Dr. Test Doctor',
      specialization: 'General Medicine',
      averageConsultationMinutes: 15,
    });
  if (res.status !== 201) {
    throw new Error(`Failed to create test doctor: ${JSON.stringify(res.body)}`);
  }

  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'DoctorPass123' });

  return {
    doctorId: res.body.data.doctor.id as number,
    userId: res.body.data.user.id as number,
    token: loginRes.body.data.accessToken as string,
  };
}

export function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// Appointment/slot tests use tomorrow's date rather than today's so fixed
// UTC clock times in the test suite never accidentally land in the past.
export function tomorrowUtcDateString(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}
