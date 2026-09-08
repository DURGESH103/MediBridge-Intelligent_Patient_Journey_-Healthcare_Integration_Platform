import request from 'supertest';
import { app, registerPatient, setupCheckedInAppointment, todayUtcDateString } from './helpers';

describe('Consultations', () => {
  it("lets a patient see their own prescriptions with full context, but never another patient's", async () => {
    const { doctor, patient, appointmentId } = await setupCheckedInAppointment();
    const otherPatient = await registerPatient();

    const start = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ appointmentId });
    const consultationId = start.body.data.id;

    await request(app)
      .patch(`/api/v1/consultations/${consultationId}`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ diagnosis: 'Seasonal allergic rhinitis', notes: 'Advised antihistamines.' });

    await request(app)
      .post(`/api/v1/consultations/${consultationId}/prescriptions`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({
        medicineName: 'Cetirizine',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '7 days',
        instructions: 'Take at night',
      });

    await request(app)
      .patch(`/api/v1/consultations/${consultationId}/complete`)
      .set('Authorization', `Bearer ${doctor.token}`);

    const mine = await request(app)
      .get('/api/v1/consultations/prescriptions/me')
      .set('Authorization', `Bearer ${patient.token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    const rx = mine.body.data[0];
    expect(rx.medicineName).toBe('Cetirizine');
    expect(rx.dosage).toBe('10mg');
    expect(rx.frequency).toBe('Once daily');
    expect(rx.instructions).toBe('Take at night');
    expect(rx.diagnosis).toBe('Seasonal allergic rhinitis');
    expect(rx.doctorName).toBeTruthy();
    expect(rx.doctorSpecialization).toBeTruthy();
    expect(rx.departmentName).toBeTruthy();
    expect(rx.patientName).toBeTruthy();
    expect(rx.patientCode).toBeTruthy();

    const someoneElses = await request(app)
      .get('/api/v1/consultations/prescriptions/me')
      .set('Authorization', `Bearer ${otherPatient.token}`);
    expect(someoneElses.status).toBe(200);
    expect(someoneElses.body.data).toHaveLength(0);
  });

  it('runs the full consultation flow: start, look up by appointment, prescribe, request a lab test, complete', async () => {
    const { doctor, appointmentId } = await setupCheckedInAppointment();

    const start = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ appointmentId });
    expect(start.status).toBe(201);
    expect(start.body.data.status).toBe('IN_PROGRESS');
    const consultationId = start.body.data.id;

    const lookup = await request(app)
      .get(`/api/v1/consultations/by-appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${doctor.token}`);
    expect(lookup.status).toBe(200);
    expect(lookup.body.data.id).toBe(consultationId);

    const prescription = await request(app)
      .post(`/api/v1/consultations/${consultationId}/prescriptions`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' });
    expect(prescription.status).toBe(201);

    const labRequest = await request(app)
      .post(`/api/v1/consultations/${consultationId}/lab-tests`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ testName: 'Complete Blood Count' });
    expect(labRequest.status).toBe(201);

    const complete = await request(app)
      .patch(`/api/v1/consultations/${consultationId}/complete`)
      .set('Authorization', `Bearer ${doctor.token}`);
    expect(complete.status).toBe(200);
    expect(complete.body.data.consultation.status).toBe('COMPLETED');
    expect(complete.body.data.nextStep).toBe('LABORATORY');
  });

  it('rejects starting a consultation before the patient has checked in', async () => {
    const { doctor } = await setupCheckedInAppointment();
    const otherPatient = await registerPatient();

    const today = todayUtcDateString();
    const slotsRes = await request(app)
      .get(`/api/v1/appointments/available-slots?doctorId=${doctor.doctorId}&date=${today}`)
      .set('Authorization', `Bearer ${otherPatient.token}`);
    const slot = slotsRes.body.data.find((s: { available: boolean }) => s.available);

    const bookingRes = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${otherPatient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${today}T${slot.startTime}:00Z` });

    const notCheckedIn = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ appointmentId: bookingRes.body.data.id });
    expect(notCheckedIn.status).toBe(400);
  });

  it('returns 404 when looking up a consultation for an appointment that has none', async () => {
    const { doctor, appointmentId } = await setupCheckedInAppointment();

    const lookup = await request(app)
      .get(`/api/v1/consultations/by-appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${doctor.token}`);
    expect(lookup.status).toBe(404);
  });

  it('scopes consultation access to the owning patient and doctor', async () => {
    const { doctor, patient, appointmentId } = await setupCheckedInAppointment();
    const stranger = await registerPatient();

    const start = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ appointmentId });
    const consultationId = start.body.data.id;

    const ownerLookup = await request(app)
      .get(`/api/v1/consultations/by-appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(ownerLookup.status).toBe(200);

    const strangerLookup = await request(app)
      .get(`/api/v1/consultations/by-appointment/${appointmentId}`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(strangerLookup.status).toBe(403);

    const strangerById = await request(app)
      .get(`/api/v1/consultations/${consultationId}`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(strangerById.status).toBe(403);
  });
});
