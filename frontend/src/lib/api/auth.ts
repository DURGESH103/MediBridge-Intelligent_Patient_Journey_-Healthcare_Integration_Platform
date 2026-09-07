import { apiClient } from './client';
import type { ApiSuccess } from '@/types/api';
import type { SafeUser, UserRole } from '@/types/roles';
import type { Gender } from '@/types/domain';

export interface RegisterPatientPayload {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponseData {
  user: SafeUser;
  accessToken: string;
}

export async function registerPatient(payload: RegisterPatientPayload): Promise<AuthResponseData> {
  const res = await apiClient.post<ApiSuccess<AuthResponseData>>('/auth/register', payload);
  return res.data.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponseData> {
  const res = await apiClient.post<ApiSuccess<AuthResponseData>>('/auth/login', payload);
  return res.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function refreshSession(): Promise<{ accessToken: string }> {
  const res = await apiClient.post<ApiSuccess<{ accessToken: string }>>('/auth/refresh');
  return res.data.data;
}

export async function createStaffUser(payload: { email: string; password: string; role: UserRole }): Promise<SafeUser> {
  const res = await apiClient.post<ApiSuccess<SafeUser>>('/users', payload);
  return res.data.data;
}

export async function listUsers(role?: UserRole): Promise<SafeUser[]> {
  const res = await apiClient.get<ApiSuccess<SafeUser[]>>('/users', { params: { role } });
  return res.data.data;
}

export async function setUserActive(id: number, isActive: boolean): Promise<SafeUser> {
  const res = await apiClient.patch<ApiSuccess<SafeUser>>(`/users/${id}/status`, { isActive });
  return res.data.data;
}
