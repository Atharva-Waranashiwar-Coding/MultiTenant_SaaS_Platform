'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';

export function useTeams(orgId?: string) {
  return useQuery({
    queryKey: ['teams', orgId],
    queryFn: () => teamsApi.list(orgId!),
    enabled: !!orgId,
  });
}

export function useTeam(orgId?: string, teamId?: string) {
  return useQuery({
    queryKey: ['team', orgId, teamId],
    queryFn: () => teamsApi.get(orgId!, teamId!),
    enabled: !!orgId && !!teamId,
  });
}

export function useCreateTeam(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; departmentId?: string }) => teamsApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', orgId] }),
  });
}

export function useUpdateTeam(orgId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; departmentId?: string }) => teamsApi.update(orgId, teamId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams', orgId] });
      qc.invalidateQueries({ queryKey: ['team', orgId, teamId] });
    },
  });
}

export function useDeleteTeam(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => teamsApi.remove(orgId, teamId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams', orgId] }),
  });
}

export function useAddTeamMember(orgId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; isLead?: boolean }) => teamsApi.addMember(orgId, teamId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', orgId, teamId] }),
  });
}

export function useRemoveTeamMember(orgId: string, teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(orgId, teamId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team', orgId, teamId] }),
  });
}
