import request from 'supertest';
import { app, registerPatient } from './helpers';

describe('Authentication', () => {
  it('registers a new patient and returns an access token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alice@example.com',
      password: 'Passw0rd123',
      fullName: 'Alice Example',
      dateOfBirth: '1995-04-12',
      gender: 'FEMALE',
      phone: '+911234500001',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.role).toBe('PATIENT');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  it('rejects registration with an email that is already in use', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'bob@example.com',
      password: 'Passw0rd123',
      fullName: 'Bob Example',
      dateOfBirth: '1988-02-02',
      gender: 'MALE',
      phone: '+911234500002',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'bob@example.com',
      password: 'Passw0rd123',
      fullName: 'Bob Duplicate',
      dateOfBirth: '1988-02-02',
      gender: 'MALE',
      phone: '+911234500003',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration for a patient already registered with the same phone and DOB', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'carol1@example.com',
      password: 'Passw0rd123',
      fullName: 'Carol Example',
      dateOfBirth: '1991-06-15',
      gender: 'FEMALE',
      phone: '+911234500004',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'carol2@example.com',
      password: 'Passw0rd123',
      fullName: 'Carol Example',
      dateOfBirth: '1991-06-15',
      gender: 'FEMALE',
      phone: '+911234500004',
    });

    expect(res.status).toBe(409);
  });

  it('rejects weak passwords and invalid input at the validation layer', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'weak',
      fullName: '',
      dateOfBirth: '2099-01-01',
      gender: 'MALE',
      phone: '1',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    const { email } = await registerPatient({ password: 'CorrectPass123' });

    const goodLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'CorrectPass123' });
    expect(goodLogin.status).toBe(200);
    expect(typeof goodLogin.body.data.accessToken).toBe('string');

    const badLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPassword1' });
    expect(badLogin.status).toBe(401);
  });

  it('rotates the refresh token on use and rejects the old token afterwards', async () => {
    const { email } = await registerPatient({ password: 'RotatePass123' });
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'RotatePass123' });

    const originalCookie = loginRes.headers['set-cookie'];
    expect(originalCookie).toBeDefined();

    const firstRefresh = await request(app).post('/api/v1/auth/refresh').set('Cookie', originalCookie);
    expect(firstRefresh.status).toBe(200);

    // Replaying the pre-rotation cookie should now be rejected.
    const reuseAttempt = await request(app).post('/api/v1/auth/refresh').set('Cookie', originalCookie);
    expect(reuseAttempt.status).toBe(401);
  });

  it('rejects requests to protected routes without a token', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('enforces role-based access control on admin-only routes', async () => {
    const { token } = await registerPatient();
    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns the current session\'s user on /auth/me and rejects it without a token', async () => {
    const { token, email } = await registerPatient();

    const authed = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(authed.status).toBe(200);
    expect(authed.body.data.email).toBe(email);
    expect(authed.body.data.role).toBe('PATIENT');
    expect(authed.body.data.passwordHash).toBeUndefined();

    const unauthed = await request(app).get('/api/v1/auth/me');
    expect(unauthed.status).toBe(401);
  });
});
