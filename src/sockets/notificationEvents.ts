import { tryGetSocketServer } from './index';
import { Notification } from '../modules/notifications/notification.types';

export function emitNotificationNew(userId: number, notification: Notification): void {
  tryGetSocketServer()?.to(`user:${userId}`).emit('notification:new', notification);
}
