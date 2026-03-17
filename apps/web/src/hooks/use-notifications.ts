'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';

export function useNotifications(orgId?: string, params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['notifications', orgId, params],
    queryFn: () => notificationsApi.list(orgId!, params),
    enabled: !!orgId,
    refetchInterval: 30_000, // poll every 30s for new notifications
  });
}

export function useUnreadCount(orgId?: string) {
  return useQuery({
    queryKey: ['notifications-unread', orgId],
    queryFn: () => notificationsApi.unreadCount(orgId!),
    enabled: !!orgId,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', orgId] });
      qc.invalidateQueries({ queryKey: ['notifications-unread', orgId] });
    },
  });
}

export function useMarkAllRead(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', orgId] });
      qc.invalidateQueries({ queryKey: ['notifications-unread', orgId] });
    },
  });
}
