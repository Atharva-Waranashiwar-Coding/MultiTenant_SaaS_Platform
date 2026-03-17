import apiClient from '../axios';
import type { Team, TeamMember } from '@/types';

export const teamsApi = {
  list: (orgId: string) =>
    apiClient.get<Team[]>(`/organizations/${orgId}/teams`).then((r) => r.data),

  get: (orgId: string, teamId: string) =>
    apiClient.get<Team>(`/organizations/${orgId}/teams/${teamId}`).then((r) => r.data),

  create: (orgId: string, data: { name: string; description?: string; departmentId?: string }) =>
    apiClient.post<Team>(`/organizations/${orgId}/teams`, data).then((r) => r.data),

  update: (orgId: string, teamId: string, data: { name?: string; description?: string; departmentId?: string }) =>
    apiClient.patch<Team>(`/organizations/${orgId}/teams/${teamId}`, data).then((r) => r.data),

  remove: (orgId: string, teamId: string) =>
    apiClient.delete(`/organizations/${orgId}/teams/${teamId}`).then((r) => r.data),

  addMember: (orgId: string, teamId: string, data: { userId: string; isLead?: boolean }) =>
    apiClient.post<TeamMember>(`/organizations/${orgId}/teams/${teamId}/members`, data).then((r) => r.data),

  removeMember: (orgId: string, teamId: string, userId: string) =>
    apiClient.delete(`/organizations/${orgId}/teams/${teamId}/members/${userId}`).then((r) => r.data),
};
