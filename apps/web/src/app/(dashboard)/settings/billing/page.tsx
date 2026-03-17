'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useSubscription, usePlans, useChangePlan, useUpdateBillingEmail, useSeatAvailability } from '@/hooks/use-subscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/utils';
import type { SubscriptionPlan } from '@/types';
import { CheckCircle2, Users, Zap } from 'lucide-react';

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  FREE:       'bg-gray-50 border-gray-200',
  STARTER:    'bg-blue-50 border-blue-200',
  GROWTH:     'bg-violet-50 border-violet-200',
  ENTERPRISE: 'bg-amber-50 border-amber-200',
};

const PLAN_BADGE_COLORS: Record<SubscriptionPlan, string> = {
  FREE:       'bg-gray-100 text-gray-700',
  STARTER:    'bg-blue-100 text-blue-700',
  GROWTH:     'bg-violet-100 text-violet-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
};

export default function BillingPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();
  const { data: subscription } = useSubscription(activeOrganizationId ?? undefined);
  const { data: plans } = usePlans(activeOrganizationId ?? undefined);
  const { data: seats } = useSeatAvailability(activeOrganizationId ?? undefined);
  const changePlan = useChangePlan(activeOrganizationId!);
  const updateEmail = useUpdateBillingEmail(activeOrganizationId!);

  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const isOwner = myRole === 'OWNER';

  const [billingEmail, setBillingEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  const handleEmailUpdate = () => {
    setEmailError('');
    setEmailSuccess(false);
    updateEmail.mutate(billingEmail, {
      onSuccess: () => { setEmailSuccess(true); setBillingEmail(''); },
      onError: (e) => setEmailError(getApiErrorMessage(e)),
    });
  };

  if (!subscription) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Billing & Plan" description="Manage your subscription plan and billing details" />

      {/* Current plan overview */}
      <Card className={cn('border-2', PLAN_COLORS[subscription.plan])}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', PLAN_BADGE_COLORS[subscription.plan])}>
              {subscription.plan}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Seats:</span>
              <span className="font-medium">
                {seats?.current ?? '?'} / {subscription.seatLimit === -1 ? 'Unlimited' : subscription.seatLimit}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{subscription.status.toLowerCase()}</span>
            </div>
          </div>
          {subscription.billingEmail && (
            <p className="text-xs text-muted-foreground">Billing contact: {subscription.billingEmail}</p>
          )}
          {/* Feature flags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(subscription.features).map(([key, enabled]) => (
              <span
                key={key}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs',
                  enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-400 line-through',
                )}
              >
                {enabled && <CheckCircle2 className="h-3 w-3" />}
                {key.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan selector */}
      {isOwner && plans && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Plan</CardTitle>
            <CardDescription>
              Upgrade or downgrade your subscription. No payment required in this demo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => {
                const isCurrent = plan.plan === subscription.plan;
                return (
                  <div
                    key={plan.plan}
                    className={cn(
                      'rounded-lg border p-4 transition-colors',
                      isCurrent ? PLAN_COLORS[plan.plan as SubscriptionPlan] + ' border-2' : 'hover:border-primary/50',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{plan.plan}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.seatLimit === -1 ? 'Unlimited seats' : `Up to ${plan.seatLimit} seats`}
                      </p>
                    </div>
                    <div className="space-y-1 mb-3">
                      {Object.entries(plan.features).map(([key, enabled]) => (
                        <p key={key} className={cn('text-xs', enabled ? 'text-foreground' : 'text-muted-foreground line-through')}>
                          {enabled ? '✓' : '✗'} {key.replace(/_/g, ' ')}
                        </p>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent || changePlan.isPending}
                      className="w-full"
                      onClick={() => changePlan.mutate({ plan: plan.plan as SubscriptionPlan })}
                    >
                      {isCurrent ? 'Current plan' : `Switch to ${plan.plan}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing email */}
      {(isOwner || myRole === 'ADMIN') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Billing Contact</CardTitle>
            <CardDescription>Who receives billing communications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            {emailSuccess && <p className="text-sm text-green-700">Billing email updated.</p>}
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>Email address</Label>
                <Input
                  type="email"
                  placeholder={subscription.billingEmail ?? 'billing@yourcompany.com'}
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleEmailUpdate}
                  disabled={!billingEmail || updateEmail.isPending}
                >
                  {updateEmail.isPending ? 'Saving...' : 'Update'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
