import apiClient from '../axios';
import type { AnalyticsSummary, AnalyticsTrends } from '@/types';

export const analyticsApi = {
  getSummary: (orgId: string) =>
    apiClient
      .get<AnalyticsSummary>(`/organizations/${orgId}/analytics/summary`)
      .then((r) => r.data),

  getTrends: (orgId: string) =>
    apiClient
      .get<AnalyticsTrends>(`/organizations/${orgId}/analytics/trends`)
      .then((r) => r.data),
};
