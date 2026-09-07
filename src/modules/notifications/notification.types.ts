export enum NotificationType {
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  QUEUE_UPDATE = 'QUEUE_UPDATE',
  LAB_REPORT_READY = 'LAB_REPORT_READY',
  GENERAL = 'GENERAL',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
}
