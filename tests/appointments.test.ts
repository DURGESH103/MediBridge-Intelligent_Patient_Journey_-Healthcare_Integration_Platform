import request from 'supertest';
import { app, createDepartment, createDoctor, createStaffUser, registerPatient, tomorrowUtcDateString } from './helpers';
import { UserRole } from '../src/types/roles';

describe('Appointments', () => {
  async function setupDoctorWithFullDayAvailability() {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctor = await createDoctor(admin.token, department.id);

    const date = tomorrowUtcDateString();
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();

    await request(app)
      .put(`/api/v1/doctors/${doctor.doctorId}/availability`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    return { admin, doctor, date };
  }

  it('books an appointment in an available slot and prevents double-booking', async () => {
    const { doctor, date } = await setupDoctorWithFullDayAvailability();
    const patientA = await registerPatient();
    const patientB = await registerPatient();

    const bookingA = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientA.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T11:00:00Z`, reason: 'Checkup' });
    expect(bookingA.status).toBe(201);
    expect(bookingA.body.data.status).toBe('SCHEDULED');

    const bookingB = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patientB.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T11:00:00Z`, reason: 'Also checkup' });
    expect(bookingB.status).toBe(409);
  });

  it('rejects a booking time that does not align with the doctor\'s slot grid', async () => {
    const { doctor, date } = await setupDoctorWithFullDayAvailability();
    const patient = await registerPatient();

    const res = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T11:07:00Z` });

    expect(res.status).toBe(400);
  });

  it('lets a patient cancel their own upcoming appointment but not someone else\'s', async () => {
    const { doctor, date } = await setupDoctorWithFullDayAvailability();
    const owner = await registerPatient();
    const stranger = await registerPatient();

    const booking = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T12:00:00Z` });
    const appointmentId = booking.body.data.id;

    const strangerCancel = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(strangerCancel.status).toBe(403);

    const ownerCancel = await request(app)
      .patch(`/api/v1/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${owner.token}`);
    expect(ownerCancel.status).toBe(200);
    expect(ownerCancel.body.data.status).toBe('CANCELLED');
  });

  it('returns available slots reflecting existing bookings', async () => {
    const { doctor, date } = await setupDoctorWithFullDayAvailability();
    const patient = await registerPatient();

    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T13:00:00Z` });

    const res = await request(app)
      .get(`/api/v1/appointments/available-slots?doctorId=${doctor.doctorId}&date=${date}`)
      .set('Authorization', `Bearer ${patient.token}`);

    expect(res.status).toBe(200);
    const bookedSlot = res.body.data.find((slot: { startTime: string }) => slot.startTime === '13:00');
    expect(bookedSlot.available).toBe(false);
  });

  it('includes the whole day when filtering by fromDate/toDate, not just midnight', async () => {
    const { doctor, date } = await setupDoctorWithFullDayAvailability();
    const patient = await registerPatient();

    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T23:00:00Z` });

    const res = await request(app)
      .get(`/api/v1/appointments?doctorId=${doctor.doctorId}&fromDate=${date}&toDate=${date}`)
      .set('Authorization', `Bearer ${doctor.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((a: { scheduledAt: string }) => a.scheduledAt.startsWith(`${date}T23:00`))).toBe(true);
  });
});
