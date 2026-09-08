import request from 'supertest';
import { app, createDepartment, createDoctor, createStaffUser, registerPatient, todayUtcDateString } from './helpers';
import { UserRole } from '../src/types/roles';

describe('Patient Journey Tracker', () => {
  it('advances the computed journey stage through the full visit without lab tests', async () => {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctor = await createDoctor(admin.token, department.id);
    const patient = await registerPatient();

    const today = todayUtcDateString();
    const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay();
    await request(app)
      .put(`/api/v1/doctors/${doctor.doctorId}/availability`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    const slotsRes = await request(app)
      .get(`/api/v1/appointments/available-slots?doctorId=${doctor.doctorId}&date=${today}`)
      .set('Authorization', `Bearer ${patient.token}`);
    const slot = slotsRes.body.data.find((s: { available: boolean }) => s.available);

    const booking = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${today}T${slot.startTime}:00Z` });
    const appointmentId = booking.body.data.id;

    const journeyAfterBooking = await request(app)
      .get(`/api/v1/journeys/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(journeyAfterBooking.body.data.currentStage).toBe('CHECK_IN');

    await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId });

    const journeyAfterCheckIn = await request(app)
      .get(`/api/v1/journeys/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(journeyAfterCheckIn.body.data.currentStage).toBe('QUEUE');
    expect(journeyAfterCheckIn.body.data.nextAction).toMatch(/token #\d+/);

    await request(app)
      .patch(`/api/v1/queue/doctors/${doctor.doctorId}/call-next`)
      .set('Authorization', `Bearer ${doctor.token}`);

    const journeyAfterCall = await request(app)
      .get(`/api/v1/journeys/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(journeyAfterCall.body.data.currentStage).toBe('CONSULTATION');

    const startConsultation = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ appointmentId });
    const consultationId = startConsultation.body.data.id;

    const completion = await request(app)
      .patch(`/api/v1/consultations/${consultationId}/complete`)
      .set('Authorization', `Bearer ${doctor.token}`);
    expect(completion.body.data.nextStep).toBe('BILLING');

    // No prescriptions and no labs were added, but billing is still pending -
    // the journey should now be waiting on BILLING, not already COMPLETED.
    const journeyAfterConsultation = await request(app)
      .get(`/api/v1/journeys/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(journeyAfterConsultation.body.data.overallStatus).toBe('IN_PROGRESS');
    expect(journeyAfterConsultation.body.data.currentStage).toBe('BILLING');
    const queueStageBeforeBilling = journeyAfterConsultation.body.data.stages.find(
      (s: { id: string }) => s.id === 'QUEUE'
    );
    expect(queueStageBeforeBilling.status).toBe('COMPLETED');
    const prescriptionStage = journeyAfterConsultation.body.data.stages.find(
      (s: { id: string }) => s.id === 'PRESCRIPTION'
    );
    expect(prescriptionStage.status).toBe('SKIPPED');

    const billingStaff = await createStaffUser(UserRole.BILLING_STAFF);
    const pendingBilling = await request(app)
      .get('/api/v1/billing/pending')
      .set('Authorization', `Bearer ${billingStaff.token}`);
    const billingRecord = pendingBilling.body.data.find(
      (r: { appointmentId: number }) => r.appointmentId === appointmentId
    );
    await request(app)
      .patch(`/api/v1/billing/${billingRecord.id}/mark-paid`)
      .set('Authorization', `Bearer ${billingStaff.token}`)
      .send({ paymentMethod: 'CASH' });

    const finalJourney = await request(app)
      .get(`/api/v1/journeys/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(finalJourney.body.data.overallStatus).toBe('COMPLETED');
    expect(finalJourney.body.data.currentStage).toBeNull();
    // LABORATORY and PRESCRIPTION are marked SKIPPED (not applicable) since
    // neither a test nor a prescription was ever added; every other stage -
    // including the terminal COMPLETED stage - is COMPLETED.
    expect(
      finalJourney.body.data.stages.every((s: { status: string }) => s.status === 'COMPLETED' || s.status === 'SKIPPED')
    ).toBe(true);
    const laboratoryStage = finalJourney.body.data.stages.find((s: { id: string }) => s.id === 'LABORATORY');
    expect(laboratoryStage.status).toBe('SKIPPED');
    const billingStage = finalJourney.body.data.stages.find((s: { id: string }) => s.id === 'BILLING');
    expect(billingStage.status).toBe('COMPLETED');

    const timeline = await request(app)
      .get(`/api/v1/journeys/patients/${finalJourney.body.data.patientId}/timeline`)
      .set('Authorization', `Bearer ${patient.token}`);
    const eventTypes = timeline.body.data.map((e: { eventType: string }) => e.eventType);
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        'REGISTRATION',
        'APPOINTMENT_BOOKED',
        'CHECKED_IN',
        'CONSULTATION_STARTED',
        'CONSULTATION_COMPLETED',
      ])
    );
  });

  it('routes the journey through LABORATORY when the doctor requests a test', async () => {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctor = await createDoctor(admin.token, department.id);
    const patient = await registerPatient();

    const today = todayUtcDateString();
    const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay();
    await request(app)
      .put(`/api/v1/doctors/${doctor.doctorId}/availability`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    const slotsRes = await request(app)
      .get(`/api/v1/appointments/available-slots?doctorId=${doctor.doctorId}&date=${today}`)
      .set('Authorization', `Bearer ${patient.token}`);
    const slot = slotsRes.body.data.find((s: { available: boolean }) => s.available);

    const booking = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${today}T${slot.startTime}:00Z` });
    const appointmentId = booking.body.data.id;

    await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId });
    await request(app)
      .patch(`/api/v1/queue/doctors/${doctor.doctorId}/call-next`)
      .set('Authorization', `Bearer ${doctor.token}`);

    const startConsultation = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ appointmentId });
    const consultationId = startConsultation.body.data.id;

    await request(app)
      .post(`/api/v1/consultations/${consultationId}/lab-tests`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ testName: 'Complete Blood Count' });

    const completion = await request(app)
      .patch(`/api/v1/consultations/${consultationId}/complete`)
      .set('Authorization', `Bearer ${doctor.token}`);
    expect(completion.body.data.nextStep).toBe('LABORATORY');

    const journeyAfterConsultation = await request(app)
      .get(`/api/v1/journeys/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(journeyAfterConsultation.body.data.currentStage).toBe('LABORATORY');
    expect(journeyAfterConsultation.body.data.overallStatus).toBe('IN_PROGRESS');
  });

  it('marks "Waiting for Doctor" complete even when the consultation is started without calling the queue entry first', async () => {
    // Regression test: a doctor can open a consultation straight from the
    // Consultations list without ever clicking "Call Next" on the queue
    // board, which used to leave the queue entry stuck at WAITING forever -
    // making the journey show "Waiting for Doctor: In progress" even after
    // the consultation (and the whole visit) was already completed.
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctor = await createDoctor(admin.token, department.id);
    const patient = await registerPatient();

    const today = todayUtcDateString();
    const dayOfWeek = new Date(`${today}T00:00:00Z`).getUTCDay();
    await request(app)
      .put(`/api/v1/doctors/${doctor.doctorId}/availability`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    const slotsRes = await request(app)
      .get(`/api/v1/appointments/available-slots?doctorId=${doctor.doctorId}&date=${today}`)
      .set('Authorization', `Bearer ${patient.token}`);
    const slot = slotsRes.body.data.find((s: { available: boolean }) => s.available);

    const booking = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${today}T${slot.startTime}:00Z` });
    const appointmentId = booking.body.data.id;

    const checkIn = await request(app)
      .post('/api/v1/queue/check-in')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ appointmentId });
    expect(checkIn.body.data.status).toBe('WAITING');

    // Deliberately skip PATCH /queue/doctors/:id/call-next and start the
    // consultation directly - this is exactly what the Consultations list
    // page lets a doctor do.
    const startConsultation = await request(app)
      .post('/api/v1/consultations')
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ appointmentId });
    const consultationId = startConsultation.body.data.id;

    const queueEntryAfterStart = await request(app)
      .get(`/api/v1/queue/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(queueEntryAfterStart.body.data.status).toBe('IN_PROGRESS');

    await request(app)
      .patch(`/api/v1/consultations/${consultationId}/complete`)
      .set('Authorization', `Bearer ${doctor.token}`);

    const queueEntryAfterComplete = await request(app)
      .get(`/api/v1/queue/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(queueEntryAfterComplete.body.data.status).toBe('COMPLETED');

    const journey = await request(app)
      .get(`/api/v1/journeys/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${patient.token}`);
    const queueStage = journey.body.data.stages.find((s: { id: string }) => s.id === 'QUEUE');
    const consultationStage = journey.body.data.stages.find((s: { id: string }) => s.id === 'CONSULTATION');
    expect(queueStage.status).toBe('COMPLETED');
    expect(consultationStage.status).toBe('COMPLETED');
  });
});
