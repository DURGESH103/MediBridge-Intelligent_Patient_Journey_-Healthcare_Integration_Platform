import { notificationRepository } from './notification.repository';
import { notificationProviders } from './notification.provider';
import { Notification, NotificationChannel, NotificationType } from './notification.types';

export const notificationService = {
  async notify(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP]
  ): Promise<void> {
    await Promise.all(
      channels.map((channel) => notificationProviders[channel].send({ userId, type, title, message }))
    );
  },

  async listForUser(userId: number, page: number, pageSize: number): Promise<Notification[]> {
    const offset = (page - 1) * pageSize;
    return notificationRepository.findForUser(userId, pageSize, offset);
  },

  async getUnreadCount(userId: number): Promise<number> {
    return notificationRepository.countUnread(userId);
  },

  async markRead(id: number, userId: number): Promise<void> {
    await notificationRepository.markRead(id, userId);
  },

  async markAllRead(userId: number): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },
};
