'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import type { Priority, ProjectStatus } from '@/types';

export function useProjects(orgId?: string, params?: { status?: string; priority?: string; includeArchived?: boolean }) {
  return useQuery({
    queryKey: ['projects', orgId, params],
    queryFn: () => projectsApi.list(orgId!, params),
    enabled: !!orgId,
  });
}

export function useProject(orgId?: string, projectId?: string) {
  return useQuery({
    queryKey: ['project', orgId, projectId],
    queryFn: () => projectsApi.get(orgId!, projectId!),
    enabled: !!orgId && !!projectId,
  });
}

export function useCreateProject(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; status?: ProjectStatus; priority?: Priority; dueDate?: string; tags?: string[]; ownerId?: string }) =>
      projectsApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', orgId] }),
  });
}

export function useUpdateProject(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof projectsApi.update>[2]) => projectsApi.update(orgId, projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', orgId] });
      qc.invalidateQueries({ queryKey: ['project', orgId, projectId] });
    },
  });
}

export function useArchiveProject(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, archive }: { projectId: string; archive: boolean }) =>
      archive ? projectsApi.archive(orgId, projectId) : projectsApi.unarchive(orgId, projectId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['projects', orgId] });
      qc.invalidateQueries({ queryKey: ['project', orgId, vars.projectId] });
    },
  });
}

export function useAddProjectMember(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectsApi.addMember(orgId, projectId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', orgId, projectId] }),
  });
}

export function useRemoveProjectMember(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(orgId, projectId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', orgId, projectId] }),
  });
}
