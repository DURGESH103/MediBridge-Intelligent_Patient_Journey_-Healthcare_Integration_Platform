import { notificationRepository } from './notification.repository';
import { notificationProviders } from './notification.provider';
import { usersRepository } from '../users/users.repository';
import { Notification, NotificationChannel, NotificationType } from './notification.types';
import { ApiError } from '../../utils/ApiError';

export const notificationService = {
  /**
   * Administrative workflow for one-off GENERAL announcements to a specific
   * user (e.g. "the lab will be closed Friday"). This is the only place
   * NotificationType.GENERAL is ever sent from - everything else in the app
   * uses a specific type tied to a real lifecycle event.
   */
  async sendGeneralNotification(userId: number, title: string, message: string): Promise<void> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    await this.notify(userId, NotificationType.GENERAL, title, message);
  },

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
