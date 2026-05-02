import type { LoginResponse } from '../types/admin';
import apiClient from './client';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login/', { username, password });
  return data;
}
