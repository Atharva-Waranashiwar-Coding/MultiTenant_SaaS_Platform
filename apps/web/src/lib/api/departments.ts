import apiClient from '../axios';
import type { Department, DepartmentMember } from '@/types';

export const departmentsApi = {
  list: (orgId: string) =>
    apiClient.get<Department[]>(`/organizations/${orgId}/departments`).then((r) => r.data),

  get: (orgId: string, deptId: string) =>
    apiClient.get<Department>(`/organizations/${orgId}/departments/${deptId}`).then((r) => r.data),

  create: (orgId: string, data: { name: string; description?: string }) =>
    apiClient.post<Department>(`/organizations/${orgId}/departments`, data).then((r) => r.data),

  update: (orgId: string, deptId: string, data: { name?: string; description?: string }) =>
    apiClient.patch<Department>(`/organizations/${orgId}/departments/${deptId}`, data).then((r) => r.data),

  remove: (orgId: string, deptId: string) =>
    apiClient.delete(`/organizations/${orgId}/departments/${deptId}`).then((r) => r.data),

  addMember: (orgId: string, deptId: string, data: { userId: string; isLead?: boolean }) =>
    apiClient.post<DepartmentMember>(`/organizations/${orgId}/departments/${deptId}/members`, data).then((r) => r.data),

  removeMember: (orgId: string, deptId: string, userId: string) =>
    apiClient.delete(`/organizations/${orgId}/departments/${deptId}/members/${userId}`).then((r) => r.data),
};
