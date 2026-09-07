import { appointmentRepository } from './appointment.repository';
import { doctorRepository } from '../doctors/doctor.repository';
import { patientsRepository } from '../patients/patients.repository';
import { notificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/notification.types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

function formatReminderTime(scheduledAt: Date): string {
  const hours = String(scheduledAt.getUTCHours()).padStart(2, '0');
  const minutes = String(scheduledAt.getUTCMinutes()).padStart(2, '0');
  return `${scheduledAt.toISOString().slice(0, 10)} at ${hours}:${minutes}`;
}

export const appointmentReminderService = {
  /**
   * Sends an in-app reminder for every SCHEDULED/CONFIRMED appointment that
   * has entered the reminder window and hasn't been reminded yet, marking
   * each one as sent immediately after (success or failure to notify) so a
   * given appointment is never reminded twice, even across process restarts.
   */
  async sendDueReminders(): Promise<number> {
    const due = await appointmentRepository.findDueForReminder(env.appointmentReminder.leadMinutes);
    let sent = 0;

    for (const appointment of due) {
      try {
        const [patient, doctor] = await Promise.all([
          patientsRepository.findById(appointment.patientId),
          doctorRepository.findById(appointment.doctorId),
        ]);

        if (patient?.userId && doctor) {
          await notificationService.notify(
            patient.userId,
            NotificationType.APPOINTMENT_REMINDER,
            'Appointment Reminder',
            `Reminder: your appointment with ${doctor.fullName} is on ${formatReminderTime(appointment.scheduledAt)}.`
          );
          sent += 1;
        }
      } catch (error) {
        logger.error(
          `Failed to send reminder for appointment ${appointment.id}: ${error instanceof Error ? error.message : error}`
        );
      } finally {
        // Mark as sent even on failure/no-linked-user - this is a best-effort
        // reminder, not a guaranteed-delivery queue, and retrying the same
        // failure every cycle would just spam the logs.
        await appointmentRepository.markReminderSent(appointment.id);
      }
    }

    return sent;
  },

  start(): NodeJS.Timeout {
    const timer = setInterval(() => {
      appointmentReminderService.sendDueReminders().catch((error) => {
        logger.error(`Appointment reminder job failed: ${error instanceof Error ? error.message : error}`);
      });
    }, env.appointmentReminder.checkIntervalMs);
    // Don't let this recurring timer keep the process alive on its own
    // (e.g. during graceful shutdown or in short-lived scripts).
    timer.unref();
    return timer;
  },
};
