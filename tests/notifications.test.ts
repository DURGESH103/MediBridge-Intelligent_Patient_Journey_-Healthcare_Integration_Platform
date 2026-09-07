import request from 'supertest';
import { app, createStaffUser, registerPatient } from './helpers';
import { UserRole } from '../src/types/roles';

describe('Notifications', () => {
  it('lets an admin send a GENERAL notification that the target user can list, count, and mark read', async () => {
    const admin = await createStaffUser(UserRole.ADMIN);
    const patient = await registerPatient();

    const send = await request(app)
      .post('/api/v1/notifications/general')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ userId: patient.userId, title: 'Clinic Notice', message: 'We are closed Friday.' });
    expect(send.status).toBe(201);

    const list = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${patient.token}`);
    expect(list.status).toBe(200);
    const notice = list.body.data.find((n: { title: string }) => n.title === 'Clinic Notice');
    expect(notice).toBeDefined();
    expect(notice.type).toBe('GENERAL');
    expect(notice.isRead).toBe(false);

    const unreadBefore = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${patient.token}`);
    expect(unreadBefore.body.data.count).toBeGreaterThanOrEqual(1);

    const markRead = await request(app)
      .patch(`/api/v1/notifications/${notice.id}/read`)
      .set('Authorization', `Bearer ${patient.token}`);
    expect(markRead.status).toBe(200);

    const markAll = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${patient.token}`);
    expect(markAll.status).toBe(200);

    const unreadAfter = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${patient.token}`);
    expect(unreadAfter.body.data.count).toBe(0);
  });

  it('restricts sending a GENERAL notification to admins', async () => {
    const receptionist = await createStaffUser(UserRole.RECEPTIONIST);
    const patient = await registerPatient();

    const res = await request(app)
      .post('/api/v1/notifications/general')
      .set('Authorization', `Bearer ${receptionist.token}`)
      .send({ userId: patient.userId, title: 'Not allowed', message: 'Should be blocked' });

    expect(res.status).toBe(403);
  });

  it('rejects sending a GENERAL notification to a nonexistent user', async () => {
    const admin = await createStaffUser(UserRole.ADMIN);

    const res = await request(app)
      .post('/api/v1/notifications/general')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ userId: 999999999, title: 'Ghost', message: 'No one is there' });

    expect(res.status).toBe(404);
  });
});
