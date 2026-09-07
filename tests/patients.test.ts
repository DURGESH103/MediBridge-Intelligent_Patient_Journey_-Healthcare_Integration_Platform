import request from 'supertest';
import { app, createStaffUser, registerPatient } from './helpers';
import { UserRole } from '../src/types/roles';
import { patientsRepository } from '../src/modules/patients/patients.repository';
import { Gender } from '../src/modules/patients/patients.types';

describe('Patients', () => {
  it('lets a patient view and update their own profile', async () => {
    const { token } = await registerPatient({ fullName: 'Dana Own' });

    const meRes = await request(app).get('/api/v1/patients/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.fullName).toBe('Dana Own');

    const updateRes = await request(app)
      .patch(`/api/v1/patients/${meRes.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ address: '123 Main Street' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.address).toBe('123 Main Street');
  });

  it('prevents a patient from viewing another patient\'s record', async () => {
    const patientA = await registerPatient();
    const patientB = await registerPatient();

    const meB = await request(app).get('/api/v1/patients/me').set('Authorization', `Bearer ${patientB.token}`);
    const otherPatientId = meB.body.data.id;

    const res = await request(app)
      .get(`/api/v1/patients/${otherPatientId}`)
      .set('Authorization', `Bearer ${patientA.token}`);

    expect(res.status).toBe(403);
  });

  it('lets a receptionist register a walk-in patient without a login account', async () => {
    const receptionist = await createStaffUser(UserRole.RECEPTIONIST);

    const res = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${receptionist.token}`)
      .send({
        fullName: 'Walk In Test',
        dateOfBirth: '1980-01-01',
        gender: 'MALE',
        phone: '+911234599999',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBeNull();
    expect(res.body.data.patientCode).toMatch(/^MB-\d{6}$/);
  });

  it('rejects a walk-in registration that duplicates an existing phone + DOB', async () => {
    const receptionist = await createStaffUser(UserRole.RECEPTIONIST);
    const payload = {
      fullName: 'Duplicate Walk In',
      dateOfBirth: '1982-03-03',
      gender: 'FEMALE',
      phone: '+911234588888',
    };

    const first = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${receptionist.token}`)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${receptionist.token}`)
      .send(payload);
    expect(second.status).toBe(409);
  });

  it('enforces duplicate (phone, date of birth) prevention at the database level', async () => {
    // Calls the repository directly, bypassing patientsService's app-level
    // pre-check, to prove the uq_patients_phone_dob constraint itself (added
    // in migration 008) is the thing rejecting the second insert - not just
    // the SELECT-then-insert check, which can't close a real race condition
    // on its own.
    const payload = {
      fullName: 'DB Constraint Test',
      dateOfBirth: '1975-06-06',
      gender: Gender.MALE,
      phone: '+911234577777',
    };

    await patientsRepository.create(payload);
    await expect(patientsRepository.create(payload)).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
  });
});
