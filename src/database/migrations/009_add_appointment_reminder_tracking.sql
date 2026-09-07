-- Tracks whether a reminder notification has already been sent for an
-- appointment, so the scheduled reminder job (appointmentReminder.service.ts)
-- never sends a duplicate for the same appointment.
ALTER TABLE appointments
  ADD COLUMN reminder_sent_at TIMESTAMP NULL DEFAULT NULL AFTER status;
