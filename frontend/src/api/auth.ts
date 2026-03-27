import { apiClient } from './axios'
import type { AuthResponse, User } from '@/types/user'

export async function register(data: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse> {
  const response = await apiClient.post<{ data: AuthResponse }>('/auth/register', data)
  return response.data.data
}

export async function login(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', data)
  return response.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get<{ data: User }>('/auth/me')
  return response.data.data
}
