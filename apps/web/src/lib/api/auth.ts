import apiClient from '../axios';
import type { AuthResponse, AuthTokens, User } from '@/types';

export const authApi = {
  signup: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post<AuthResponse>('/auth/signup', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }).then((r) => r.data),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, password }).then((r) => r.data),

  verifyEmail: (token: string) =>
    apiClient.get<{ message: string }>(`/auth/verify-email?token=${token}`).then((r) => r.data),

  switchOrg: (organizationId: string) =>
    apiClient.post<AuthTokens>('/auth/switch-org', { organizationId }).then((r) => r.data),
};
