import request from 'supertest';
import { app, createDepartment, createDoctor, createStaffUser, registerPatient, todayUtcDateString } from './helpers';
import { UserRole } from '../src/types/roles';

describe('Queue', () => {
  async function setupDoctorAvailableToday() {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctor = await createDoctor(admin.token, department.id);

    const today = todayUtcDateString();
    const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay();

    await request(app)
      .put(`/api/v1/doctors/${doctor.doctorId}/availability`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    return { admin, doctor, today };
  }

  async function bookNextAvailableSlot(patientToken: string, doctorId: number, date: string) {
    const slotsRes = await request(app)
      .get(`/api/v1/appointments/available-slots?doctorId=${doctorId}&date=${date}`)
      .set('Authorization', `Bearer ${patientToken}`);
    const available = slotsRes.body.data.find((slot: { available: boolean }) => slot.available);
    if (!available) {
      throw new Error('No available slot found for today - cannot exercise check-in in this test run');
    }

    const bookingRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId, scheduledAt: `${date}T${available.startTime}:00Z` });

    return bookingRes.body.data;
  }

  it('assigns sequential tokens as patients check in and updates the queue summary', async () => {
    const { doctor, today } = await setupDoctorAvailableToday();
    const patientA = await registerPatient();
    const patientB = await registerPatient();

    const appointmentA = await bookNextAvailableSlot(patientA.token, doctor.doctorId, today);
    const appointmentB = await bookNextAvailableSlot(patientB.token, doctor.doctorId, today);

    const checkInA = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${patientA.token}`)
      .send({ appointmentId: appointmentA.id });
    expect(checkInA.status).toBe(201);
    const tokenA = checkInA.body.data.tokenNumber;

    const checkInB = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${patientB.token}`)
      .send({ appointmentId: appointmentB.id });
    expect(checkInB.status).toBe(201);
    expect(checkInB.body.data.tokenNumber).toBe(tokenA + 1);

    const summary = await request(app)
      .get(`/api/v1/queue/doctors/${doctor.doctorId}/summary`)
      .set('Authorization', `Bearer ${patientA.token}`);
    expect(summary.body.data.totalWaiting).toBeGreaterThanOrEqual(2);
  });

  it('rejects checking in to another patient\'s appointment', async () => {
    const { doctor, today } = await setupDoctorAvailableToday();
    const owner = await registerPatient();
    const stranger = await registerPatient();

    const appointment = await bookNextAvailableSlot(owner.token, doctor.doctorId, today);

    const res = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${stranger.token}`)
      .send({ appointmentId: appointment.id });

    expect(res.status).toBe(403);
  });

  it('calls the next waiting patient in token order and blocks calling next while someone is in progress', async () => {
    const { doctor, today } = await setupDoctorAvailableToday();
    const patient = await registerPatient();
    const appointment = await bookNextAvailableSlot(patient.token, doctor.doctorId, today);

    await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId: appointment.id });

    const callNext = await request(app)
      .patch(`/api/v1/queue/doctors/${doctor.doctorId}/call-next`)
      .set('Authorization', `Bearer ${doctor.token}`);
    expect(callNext.status).toBe(200);
    expect(callNext.body.data.status).toBe('IN_PROGRESS');

    const callNextAgain = await request(app)
      .patch(`/api/v1/queue/doctors/${doctor.doctorId}/call-next`)
      .set('Authorization', `Bearer ${doctor.token}`);
    expect(callNextAgain.status).toBe(409);
  });
});
