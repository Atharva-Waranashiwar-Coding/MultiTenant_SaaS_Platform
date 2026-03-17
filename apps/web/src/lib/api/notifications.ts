import apiClient from '../axios';
import type { Notification, PaginatedResult } from '@/types';

export const notificationsApi = {
  list: (orgId: string, params?: { unreadOnly?: boolean; page?: number; limit?: number }) =>
    apiClient
      .get<PaginatedResult<Notification>>(`/organizations/${orgId}/notifications`, { params })
      .then((r) => r.data),

  unreadCount: (orgId: string) =>
    apiClient
      .get<{ count: number }>(`/organizations/${orgId}/notifications/unread-count`)
      .then((r) => r.data),

  markRead: (orgId: string, id: string) =>
    apiClient
      .patch(`/organizations/${orgId}/notifications/${id}/read`)
      .then((r) => r.data),

  markAllRead: (orgId: string) =>
    apiClient
      .patch<{ message: string }>(`/organizations/${orgId}/notifications/read-all`)
      .then((r) => r.data),
};
