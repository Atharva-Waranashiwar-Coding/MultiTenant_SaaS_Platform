'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '@/lib/api/permissions';
import type { MemberRole } from '@/types';

/**
 * Fetches the full permission map for the current user.
 * Returns { data: Record<string, boolean>, isLoading, ... }
 *
 * Usage:
 *   const { can } = usePermissions(orgId);
 *   if (can('projects.create')) { ... }
 */
export function usePermissions(orgId?: string) {
  const query = useQuery({
    queryKey: ['permissions', orgId],
    queryFn: () => permissionsApi.getMyPermissions(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60_000, // cache for 5 minutes — permissions don't change often
  });

  const can = (permission: string): boolean => {
    if (!query.data) return false;
    return query.data[permission] === true;
  };

  return { ...query, can };
}

export function usePermissionOverrides(orgId?: string) {
  return useQuery({
    queryKey: ['permission-overrides', orgId],
    queryFn: () => permissionsApi.listOverrides(orgId!),
    enabled: !!orgId,
  });
}

export function useUpsertPermissionOverride(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permission, granted }: { role: MemberRole; permission: string; granted: boolean }) =>
      permissionsApi.upsertOverride(orgId, role, permission, granted),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permission-overrides', orgId] });
      qc.invalidateQueries({ queryKey: ['permissions', orgId] });
    },
  });
}

export function useDeletePermissionOverride(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permissionsApi.deleteOverride(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permission-overrides', orgId] });
      qc.invalidateQueries({ queryKey: ['permissions', orgId] });
    },
  });
}
