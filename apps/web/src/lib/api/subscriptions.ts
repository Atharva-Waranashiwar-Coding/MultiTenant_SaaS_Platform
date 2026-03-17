import apiClient from '../axios';
import type { Subscription, PlanFeature, SubscriptionPlan } from '@/types';

export const subscriptionsApi = {
  get: (orgId: string) =>
    apiClient.get<Subscription>(`/organizations/${orgId}/subscription`).then((r) => r.data),

  getPlans: (orgId: string) =>
    apiClient.get<PlanFeature[]>(`/organizations/${orgId}/subscription/plans`).then((r) => r.data),

  checkSeats: (orgId: string) =>
    apiClient
      .get<{ allowed: boolean; current: number; limit: number }>(
        `/organizations/${orgId}/subscription/seats`,
      )
      .then((r) => r.data),

  changePlan: (orgId: string, plan: SubscriptionPlan, billingEmail?: string) =>
    apiClient
      .patch<Subscription>(`/organizations/${orgId}/subscription/plan`, { plan, billingEmail })
      .then((r) => r.data),

  updateBillingEmail: (orgId: string, billingEmail: string) =>
    apiClient
      .patch<Subscription>(`/organizations/${orgId}/subscription/billing-email`, { billingEmail })
      .then((r) => r.data),
};
