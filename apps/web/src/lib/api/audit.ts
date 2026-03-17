import apiClient from '../axios';
import type { AuditLog } from '@/types';

export const auditApi = {
  list: (orgId: string, limit?: number) =>
    apiClient
      .get<AuditLog[]>(`/organizations/${orgId}/audit`, { params: { limit } })
      .then((r) => r.data),
};
