'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api/members';
import type { MemberRole } from '@/types';

export function useMembers(orgId?: string, query?: { search?: string; role?: MemberRole; teamId?: string; departmentId?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['members', orgId, query],
    queryFn: () => membersApi.list(orgId!, query),
    enabled: !!orgId,
  });
}

export function useMember(orgId?: string, userId?: string) {
  return useQuery({
    queryKey: ['member', orgId, userId],
    queryFn: () => membersApi.get(orgId!, userId!),
    enabled: !!orgId && !!userId,
  });
}

export function useSetMemberActive(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      membersApi.setActive(orgId, userId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', orgId] }),
  });
}

export function useUpdateMemberRole(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      membersApi.updateRole(orgId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', orgId] }),
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => membersApi.remove(orgId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', orgId] }),
  });
}

export function useBulkMemberAction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, action }: { userIds: string[]; action: 'activate' | 'deactivate' | 'remove' }) =>
      membersApi.bulk(orgId, userIds, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
}
