'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import type { TaskStatus, Priority } from '@/types';

export function useTasks(orgId?: string, projectId?: string, params?: { status?: TaskStatus; assigneeId?: string; search?: string }) {
  return useQuery({
    queryKey: ['tasks', orgId, projectId, params],
    queryFn: () => tasksApi.list(orgId!, projectId!, params),
    enabled: !!orgId && !!projectId,
  });
}

export function useTask(orgId?: string, projectId?: string, taskId?: string) {
  return useQuery({
    queryKey: ['task', orgId, projectId, taskId],
    queryFn: () => tasksApi.get(orgId!, projectId!, taskId!),
    enabled: !!orgId && !!projectId && !!taskId,
  });
}

export function useCreateTask(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; status?: TaskStatus; priority?: Priority; dueDate?: string; assigneeId?: string }) =>
      tasksApi.create(orgId, projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  });
}

export function useUpdateTask(orgId: string, projectId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof tasksApi.update>[3]) => tasksApi.update(orgId, projectId, taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] });
      qc.invalidateQueries({ queryKey: ['task', orgId, projectId, taskId] });
    },
  });
}

export function useDeleteTask(orgId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(orgId, projectId, taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', orgId, projectId] }),
  });
}

export function useAddComment(orgId: string, projectId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => tasksApi.addComment(orgId, projectId, taskId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', orgId, projectId, taskId] }),
  });
}

export function useDeleteComment(orgId: string, projectId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => tasksApi.deleteComment(orgId, projectId, taskId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', orgId, projectId, taskId] }),
  });
}
