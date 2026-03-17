'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import type { SubscriptionPlan } from '@/types';

export function useSubscription(orgId?: string) {
  return useQuery({
    queryKey: ['subscription', orgId],
    queryFn: () => subscriptionsApi.get(orgId!),
    enabled: !!orgId,
  });
}

export function usePlans(orgId?: string) {
  return useQuery({
    queryKey: ['subscription-plans', orgId],
    queryFn: () => subscriptionsApi.getPlans(orgId!),
    enabled: !!orgId,
    staleTime: 10 * 60_000, // plans don't change
  });
}

export function useSeatAvailability(orgId?: string) {
  return useQuery({
    queryKey: ['seat-availability', orgId],
    queryFn: () => subscriptionsApi.checkSeats(orgId!),
    enabled: !!orgId,
  });
}

export function useChangePlan(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ plan, billingEmail }: { plan: SubscriptionPlan; billingEmail?: string }) =>
      subscriptionsApi.changePlan(orgId, plan, billingEmail),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription', orgId] }),
  });
}

export function useUpdateBillingEmail(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (billingEmail: string) => subscriptionsApi.updateBillingEmail(orgId, billingEmail),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription', orgId] }),
  });
}
