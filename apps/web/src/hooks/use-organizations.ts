'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { organizationsApi } from '@/lib/api/organizations';
import { useAuthStore } from '@/store/auth.store';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: organizationsApi.list,
    staleTime: 1000 * 60 * 2,
  });
}

export function useOrganization(orgId?: string) {
  return useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => organizationsApi.get(orgId!),
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { setActiveOrganization, setTokens } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: organizationsApi.create,
    onSuccess: async (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setActiveOrganization(org.id);
      router.replace('/dashboard');
    },
  });
}

export function useUpdateOrganization(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof organizationsApi.update>[1]) =>
      organizationsApi.update(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
