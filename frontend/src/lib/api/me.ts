import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { SafeUser } from '@/types/roles';

export async function getCurrentUser(): Promise<SafeUser> {
  const res = await apiClient.get<ApiSuccess<SafeUser>>('/auth/me');
  return res.data.data;
}
