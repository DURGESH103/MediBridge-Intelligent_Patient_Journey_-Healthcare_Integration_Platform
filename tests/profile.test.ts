import request from 'supertest';
import { app, createDepartment, createDoctor, createStaffUser, registerPatient } from './helpers';
import { UserRole } from '../src/types/roles';

describe('Profile', () => {
  it('lets any authenticated user view and update their own full name', async () => {
    const staff = await createStaffUser(UserRole.BILLING_STAFF);

    const before = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${staff.token}`);
    expect(before.body.data.fullName).toBeNull();

    const update = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ fullName: 'Billing Staffer' });
    expect(update.status).toBe(200);
    expect(update.body.data.fullName).toBe('Billing Staffer');

    const after = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${staff.token}`);
    expect(after.body.data.fullName).toBe('Billing Staffer');
  });

  it('lets a user change their own password and rejects an incorrect current password', async () => {
    const patient = await registerPatient({ email: 'password.change@example.com', password: 'Passw0rd123' });

    const wrongCurrent = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ currentPassword: 'WrongPass123', newPassword: 'NewPassw0rd456' });
    expect(wrongCurrent.status).toBe(400);

    const changed = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ currentPassword: 'Passw0rd123', newPassword: 'NewPassw0rd456' });
    expect(changed.status).toBe(200);

    const loginOld = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'password.change@example.com', password: 'Passw0rd123' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'password.change@example.com', password: 'NewPassw0rd456' });
    expect(loginNew.status).toBe(200);
  });

  it('lets a doctor update their own profile fields but not their department or another doctor\'s record', async () => {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctorA = await createDoctor(admin.token, department.id);
    const doctorB = await createDoctor(admin.token, department.id);

    const selfUpdate = await request(app)
      .patch(`/api/v1/doctors/${doctorA.doctorId}`)
      .set('Authorization', `Bearer ${doctorA.token}`)
      .send({ specialization: 'Cardiology', phone: '+911234500001' });
    expect(selfUpdate.status).toBe(200);
    expect(selfUpdate.body.data.specialization).toBe('Cardiology');

    const changeDepartment = await request(app)
      .patch(`/api/v1/doctors/${doctorA.doctorId}`)
      .set('Authorization', `Bearer ${doctorA.token}`)
      .send({ departmentId: department.id });
    expect(changeDepartment.status).toBe(403);

    const editSomeoneElse = await request(app)
      .patch(`/api/v1/doctors/${doctorB.doctorId}`)
      .set('Authorization', `Bearer ${doctorA.token}`)
      .send({ specialization: 'Dermatology' });
    expect(editSomeoneElse.status).toBe(403);

    const adminEdit = await request(app)
      .patch(`/api/v1/doctors/${doctorB.doctorId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ specialization: 'Dermatology' });
    expect(adminEdit.status).toBe(200);
  });
});
