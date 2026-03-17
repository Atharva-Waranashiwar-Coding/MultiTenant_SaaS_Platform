import apiClient from '../axios';
import type { Project, ProjectMember, ProjectStatus, Priority } from '@/types';

export const projectsApi = {
  list: (orgId: string, params?: { search?: string; status?: string; priority?: string; includeArchived?: boolean }) =>
    apiClient.get<Project[]>(`/organizations/${orgId}/projects`, { params }).then((r) => r.data),

  get: (orgId: string, projectId: string) =>
    apiClient.get<Project>(`/organizations/${orgId}/projects/${projectId}`).then((r) => r.data),

  create: (orgId: string, data: {
    name: string;
    description?: string;
    status?: ProjectStatus;
    priority?: Priority;
    dueDate?: string;
    tags?: string[];
    ownerId?: string;
  }) => apiClient.post<Project>(`/organizations/${orgId}/projects`, data).then((r) => r.data),

  update: (orgId: string, projectId: string, data: Partial<{
    name: string;
    description: string;
    status: ProjectStatus;
    priority: Priority;
    dueDate: string;
    tags: string[];
    ownerId: string;
  }>) => apiClient.patch<Project>(`/organizations/${orgId}/projects/${projectId}`, data).then((r) => r.data),

  archive: (orgId: string, projectId: string) =>
    apiClient.patch<Project>(`/organizations/${orgId}/projects/${projectId}/archive`).then((r) => r.data),

  unarchive: (orgId: string, projectId: string) =>
    apiClient.patch<Project>(`/organizations/${orgId}/projects/${projectId}/unarchive`).then((r) => r.data),

  addMember: (orgId: string, projectId: string, userId: string) =>
    apiClient.post<ProjectMember>(`/organizations/${orgId}/projects/${projectId}/members`, { userId }).then((r) => r.data),

  removeMember: (orgId: string, projectId: string, userId: string) =>
    apiClient.delete(`/organizations/${orgId}/projects/${projectId}/members/${userId}`).then((r) => r.data),
};
