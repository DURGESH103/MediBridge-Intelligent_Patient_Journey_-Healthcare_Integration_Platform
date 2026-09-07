import request from 'supertest';
import { app, createDepartment, createDoctor, createStaffUser, registerPatient, tomorrowUtcDateString } from './helpers';
import { UserRole } from '../src/types/roles';
import { query } from '../src/config/database';
import { appointmentReminderService } from '../src/modules/appointments/appointmentReminder.service';

describe('Appointment reminders', () => {
  it('sends exactly one reminder for an appointment inside the reminder window, never a duplicate', async () => {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctor = await createDoctor(admin.token, department.id);
    const patient = await registerPatient();

    const date = tomorrowUtcDateString();
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
    await request(app)
      .put(`/api/v1/doctors/${doctor.doctorId}/availability`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    const booking = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T10:00:00Z` });
    const appointmentId = booking.body.data.id;

    // The reminder job scans for appointments already inside its lead-time
    // window; move this one's scheduled_at to 5 minutes from now directly so
    // the test doesn't depend on real wall-clock proximity to the booked slot.
    await query('UPDATE appointments SET scheduled_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = :id', {
      id: appointmentId,
    });

    const firstRun = await appointmentReminderService.sendDueReminders();
    expect(firstRun).toBe(1);

    const notifications = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${patient.token}`);
    const reminders = notifications.body.data.filter(
      (n: { type: string; title: string }) => n.type === 'APPOINTMENT_REMINDER' && n.title === 'Appointment Reminder'
    );
    expect(reminders).toHaveLength(1);

    // Running again must not send a second reminder for the same appointment.
    const secondRun = await appointmentReminderService.sendDueReminders();
    expect(secondRun).toBe(0);

    const notificationsAfter = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${patient.token}`);
    const remindersAfter = notificationsAfter.body.data.filter(
      (n: { type: string; title: string }) => n.type === 'APPOINTMENT_REMINDER' && n.title === 'Appointment Reminder'
    );
    expect(remindersAfter).toHaveLength(1);
  });

  it('does not send a reminder for an appointment outside the reminder window', async () => {
    const admin = await createStaffUser(UserRole.ADMIN);
    const department = await createDepartment(admin.token);
    const doctor = await createDoctor(admin.token, department.id);
    const patient = await registerPatient();

    const date = tomorrowUtcDateString();
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
    await request(app)
      .put(`/api/v1/doctors/${doctor.doctorId}/availability`)
      .set('Authorization', `Bearer ${doctor.token}`)
      .send({ slots: [{ dayOfWeek, startTime: '00:00', endTime: '23:45', slotDurationMinutes: 15 }] });

    await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: doctor.doctorId, scheduledAt: `${date}T11:00:00Z` });

    // This appointment is booked for tomorrow, well outside the default
    // 60-minute reminder window, so the job should skip it entirely.
    await appointmentReminderService.sendDueReminders();

    const notifications = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${patient.token}`);
    const reminders = notifications.body.data.filter((n: { type: string }) => n.type === 'APPOINTMENT_REMINDER');
    expect(reminders).toHaveLength(0);
  });
});
