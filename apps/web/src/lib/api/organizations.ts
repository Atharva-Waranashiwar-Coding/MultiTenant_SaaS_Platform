import apiClient from '../axios';
import type { Organization } from '@/types';

export const organizationsApi = {
  create: (data: { name: string; slug: string; description?: string }) =>
    apiClient.post<Organization>('/organizations', data).then((r) => r.data),

  list: () => apiClient.get<Organization[]>('/organizations').then((r) => r.data),

  get: (orgId: string) =>
    apiClient.get<Organization>(`/organizations/${orgId}`).then((r) => r.data),

  update: (orgId: string, data: { name?: string; description?: string; logoUrl?: string }) =>
    apiClient.patch<Organization>(`/organizations/${orgId}`, data).then((r) => r.data),
};
