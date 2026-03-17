import apiClient from '../axios';
import type { Task, TaskComment, TaskStatus, Priority } from '@/types';

export const tasksApi = {
  list: (orgId: string, projectId: string, params?: { status?: TaskStatus; assigneeId?: string; search?: string }) =>
    apiClient.get<Task[]>(`/organizations/${orgId}/projects/${projectId}/tasks`, { params }).then((r) => r.data),

  get: (orgId: string, projectId: string, taskId: string) =>
    apiClient.get<Task>(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`).then((r) => r.data),

  create: (orgId: string, projectId: string, data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
    dueDate?: string;
    tags?: string[];
    assigneeId?: string;
  }) => apiClient.post<Task>(`/organizations/${orgId}/projects/${projectId}/tasks`, data).then((r) => r.data),

  update: (orgId: string, projectId: string, taskId: string, data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    dueDate: string;
    tags: string[];
    assigneeId: string;
  }>) => apiClient.patch<Task>(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data),

  remove: (orgId: string, projectId: string, taskId: string) =>
    apiClient.delete(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}`).then((r) => r.data),

  addComment: (orgId: string, projectId: string, taskId: string, content: string) =>
    apiClient.post<TaskComment>(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments`, { content }).then((r) => r.data),

  deleteComment: (orgId: string, projectId: string, taskId: string, commentId: string) =>
    apiClient.delete(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/comments/${commentId}`).then((r) => r.data),
};
