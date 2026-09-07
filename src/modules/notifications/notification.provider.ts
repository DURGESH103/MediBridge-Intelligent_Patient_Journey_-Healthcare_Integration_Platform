import { notificationRepository } from './notification.repository';
import { NotificationChannel, NotificationPayload } from './notification.types';
import { emitNotificationNew } from '../../sockets/notificationEvents';
import { logger } from '../../config/logger';

/**
 * A delivery channel for notifications. IN_APP is the only channel that's
 * actually wired to a real transport (the database + a Socket.IO push).
 * EMAIL and SMS are intentionally stubbed - the interface is what future
 * work plugs a real provider (SendGrid, Twilio, etc.) into.
 */
export interface NotificationProvider {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<void>;
}

export const inAppProvider: NotificationProvider = {
  channel: NotificationChannel.IN_APP,
  async send(payload: NotificationPayload): Promise<void> {
    const notification = await notificationRepository.create({
      userId: payload.userId,
      type: payload.type,
      channel: NotificationChannel.IN_APP,
      title: payload.title,
      message: payload.message,
    });
    emitNotificationNew(payload.userId, notification);
  },
};

export const emailProvider: NotificationProvider = {
  channel: NotificationChannel.EMAIL,
  async send(payload: NotificationPayload): Promise<void> {
    logger.info(`[Email provider stub] Would email user ${payload.userId}: "${payload.title}"`);
  },
};

export const smsProvider: NotificationProvider = {
  channel: NotificationChannel.SMS,
  async send(payload: NotificationPayload): Promise<void> {
    logger.info(`[SMS provider stub] Would text user ${payload.userId}: "${payload.title}"`);
  },
};

export const notificationProviders: Record<NotificationChannel, NotificationProvider> = {
  [NotificationChannel.IN_APP]: inAppProvider,
  [NotificationChannel.EMAIL]: emailProvider,
  [NotificationChannel.SMS]: smsProvider,
};
