import request from 'supertest';
import { app, createDepartment, createStaffUser, registerPatient, todayUtcDateString } from './helpers';
import { UserRole } from '../src/types/roles';

describe('Billing', () => {
  async function setupCompletedConsultation(consultationFee: number) {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);

    const doctorEmail = `billing.doctor${Date.now()}@medibridge.local`;
    const doctorRes = await request(app)
      .post('/api/v1/doctors')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        email: doctorEmail,
        password: 'DoctorPass123',
        departmentId: department.id,
        fullName: 'Dr. Billing Test',
        specialization: 'General Medicine',
        averageConsultationMinutes: 15,
        consultationFee,
      });
    const doctorId = doctorRes.body.data.doctor.id as number;
    const doctorLogin = await request(app).post('/api/v1/auth/login').send({ email: doctorEmail, password: 'DoctorPass123' });
    const doctorToken = doctorLogin.body.data.accessToken as string;

    const today = todayUtcDateString();
    const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay();
    await request(app)
      .put(`/api/v1/doctors/${doctorId}/availability`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    const patient = await registerPatient();
    const slotsRes = await request(app)
      .get(`/api/v1/appointments/available-slots?doctorId=${doctorId}&date=${today}`)
      .set('Authorization', `Bearer ${patient.token}`);
    const slot = slotsRes.body.data.find((s: { available: boolean }) => s.available);

    const booking = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId, scheduledAt: `${today}T${slot.startTime}:00Z` });
    const appointmentId = booking.body.data.id;

    await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId });
    await request(app).patch(`/api/v1/queue/doctors/${doctorId}/call-next`).set('Authorization', `Bearer ${doctorToken}`);

    const start = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ appointmentId });
    const consultationId = start.body.data.id;

    await request(app).patch(`/api/v1/consultations/${consultationId}/complete`).set('Authorization', `Bearer ${doctorToken}`);

    const me = await request(app).get('/api/v1/patients/me').set('Authorization', `Bearer ${patient.token}`);
    return { admin, patient, patientId: me.body.data.id as number };
  }

  it('creates a real billing record when a consultation completes, visible to billing staff and payable exactly once', async () => {
    const { patient, patientId } = await setupCompletedConsultation(75);
    const billingStaff = await createStaffUser(UserRole.BILLING_STAFF);

    const pending = await request(app)
      .get('/api/v1/billing/pending')
      .set('Authorization', `Bearer ${billingStaff.token}`);
    expect(pending.status).toBe(200);
    const record = pending.body.data.find((r: { patientId: number }) => r.patientId === patientId);
    expect(record).toBeDefined();
    expect(record.amount).toBe(75);
    expect(record.status).toBe('PENDING');

    const markPaid = await request(app)
      .patch(`/api/v1/billing/${record.id}/mark-paid`)
      .set('Authorization', `Bearer ${billingStaff.token}`);
    expect(markPaid.status).toBe(200);
    expect(markPaid.body.data.status).toBe('PAID');

    const markPaidAgain = await request(app)
      .patch(`/api/v1/billing/${record.id}/mark-paid`)
      .set('Authorization', `Bearer ${billingStaff.token}`);
    expect(markPaidAgain.status).toBe(400);

    const completed = await request(app)
      .get('/api/v1/billing/completed')
      .set('Authorization', `Bearer ${billingStaff.token}`);
    expect(completed.body.data.some((r: { id: number }) => r.id === record.id)).toBe(true);

    const ownRecords = await request(app)
      .get(`/api/v1/billing/patients/${patientId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(ownRecords.status).toBe(200);
    expect(ownRecords.body.data.some((r: { id: number }) => r.id === record.id)).toBe(true);
  });

  it('restricts billing endpoints to billing staff/admin and a patient to their own records', async () => {
    const { patientId } = await setupCompletedConsultation(50);
    const receptionist = await createStaffUser(UserRole.RECEPTIONIST);
    const stranger = await registerPatient();

    const blocked = await request(app)
      .get('/api/v1/billing/pending')
      .set('Authorization', `Bearer ${receptionist.token}`);
    expect(blocked.status).toBe(403);

    const blockedOther = await request(app)
      .get(`/api/v1/billing/patients/${patientId}`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(blockedOther.status).toBe(403);
  });
});
