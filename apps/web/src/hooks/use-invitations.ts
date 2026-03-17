'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '@/lib/api/invitations';
import type { MemberRole } from '@/types';

export function useInvitations(orgId?: string) {
  return useQuery({
    queryKey: ['invitations', orgId],
    queryFn: () => invitationsApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useCreateInvitation(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; role?: MemberRole }) =>
      invitationsApi.create(orgId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations', orgId] }),
  });
}

export function useRevokeInvitation(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => invitationsApi.revoke(orgId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invitations', orgId] }),
  });
}

export function useInvitationPreview(token?: string) {
  return useQuery({
    queryKey: ['invitation-preview', token],
    queryFn: () => invitationsApi.preview(token!),
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => invitationsApi.accept(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
