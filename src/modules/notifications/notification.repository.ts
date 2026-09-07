import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { query } from '../../config/database';
import { Notification, NotificationChannel, NotificationType } from './notification.types';

interface NotificationRow extends RowDataPacket {
  id: number;
  user_id: number;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  is_read: number;
  created_at: Date;
}

function mapRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    channel: row.channel,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

export const notificationRepository = {
  async create(input: {
    userId: number;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    message: string;
  }): Promise<Notification> {
    const result = await query<ResultSetHeader>(
      `INSERT INTO notifications (user_id, type, channel, title, message)
       VALUES (:userId, :type, :channel, :title, :message)`,
      input
    );
    const rows = await query<NotificationRow[]>('SELECT * FROM notifications WHERE id = :id', {
      id: result.insertId,
    });
    return mapRow(rows[0]);
  },

  async findForUser(userId: number, limit: number, offset: number): Promise<Notification[]> {
    const rows = await query<NotificationRow[]>(
      `SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
      { userId, limit, offset }
    );
    return rows.map(mapRow);
  },

  async countUnread(userId: number): Promise<number> {
    const rows = await query<RowDataPacket[]>(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = :userId AND is_read = FALSE',
      { userId }
    );
    return Number(rows[0].count);
  },

  async markRead(id: number, userId: number): Promise<void> {
    await query('UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_id = :userId', {
      id,
      userId,
    });
  },

  async markAllRead(userId: number): Promise<void> {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = :userId AND is_read = FALSE', {
      userId,
    });
  },
};
