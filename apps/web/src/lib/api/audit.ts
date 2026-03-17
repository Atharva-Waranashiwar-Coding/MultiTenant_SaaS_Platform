import apiClient from '../axios';
import type { AuditLog, PaginatedResult } from '@/types';

export interface AuditFilters {
  userId?: string;
  action?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  list: (orgId: string, filters: AuditFilters = {}) =>
    apiClient
      .get<PaginatedResult<AuditLog>>(`/organizations/${orgId}/audit`, { params: filters })
      .then((r) => r.data),
};
