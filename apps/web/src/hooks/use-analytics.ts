import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';

export function useAnalyticsSummary(orgId?: string) {
  return useQuery({
    queryKey: ['analytics', 'summary', orgId],
    queryFn: () => analyticsApi.getSummary(orgId!),
    enabled: !!orgId,
    staleTime: 60_000, // 1 minute
  });
}

export function useAnalyticsTrends(orgId?: string) {
  return useQuery({
    queryKey: ['analytics', 'trends', orgId],
    queryFn: () => analyticsApi.getTrends(orgId!),
    enabled: !!orgId,
    staleTime: 5 * 60_000, // 5 minutes
  });
}
