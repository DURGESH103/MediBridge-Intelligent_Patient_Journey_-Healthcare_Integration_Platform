import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { AppNotification } from '@/types/domain';

export async function listMyNotifications(page = 1, pageSize = 20): Promise<AppNotification[]> {
  const res = await apiClient.get<ApiSuccess<AppNotification[]>>('/notifications', { params: { page, pageSize } });
  return res.data.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiClient.get<ApiSuccess<{ count: number }>>('/notifications/unread-count');
  return res.data.data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}
