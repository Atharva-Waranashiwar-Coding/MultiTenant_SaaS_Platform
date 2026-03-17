'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/lib/api/members';
import type { MemberRole } from '@/types';

export function useMembers(orgId?: string) {
  return useQuery({
    queryKey: ['members', orgId],
    queryFn: () => membersApi.list(orgId!),
    enabled: !!orgId,
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
