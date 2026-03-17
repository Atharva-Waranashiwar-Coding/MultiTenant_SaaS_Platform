import { Injectable, ForbiddenException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus, MemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

// Plan → included feature flags & seat limits
const PLAN_FEATURES: Record<SubscriptionPlan, { seatLimit: number; features: Record<string, boolean> }> = {
  [SubscriptionPlan.FREE]: {
    seatLimit: 5,
    features: { audit: false, custom_roles: false, advanced_filters: false, api_access: false },
  },
  [SubscriptionPlan.STARTER]: {
    seatLimit: 25,
    features: { audit: true, custom_roles: false, advanced_filters: true, api_access: false },
  },
  [SubscriptionPlan.GROWTH]: {
    seatLimit: 100,
    features: { audit: true, custom_roles: true, advanced_filters: true, api_access: true },
  },
  [SubscriptionPlan.ENTERPRISE]: {
    seatLimit: -1, // unlimited
    features: { audit: true, custom_roles: true, advanced_filters: true, api_access: true },
  },
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Get the subscription for an org, auto-creating a FREE one if none exists.
   * This is the safe default — every org always has a subscription record.
   */
  async findOrCreate(orgId: string) {
    let sub = await this.prisma.subscription.findUnique({
      where: { organizationId: orgId },
    });

    if (!sub) {
      const planConfig = PLAN_FEATURES[SubscriptionPlan.FREE];
      sub = await this.prisma.subscription.create({
        data: {
          organizationId: orgId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          seatLimit: planConfig.seatLimit,
          features: planConfig.features,
        },
      });
    }

    return sub;
  }

  /**
   * Simulate a plan upgrade/downgrade (no real billing).
   * OWNER-only operation.
   */
  async changePlan(
    actorId: string,
    orgId: string,
    dto: { plan: SubscriptionPlan; billingEmail?: string },
  ) {
    // Verify actor is OWNER
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: actorId, organizationId: orgId } },
    });
    if (!membership || membership.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only the organization OWNER can change the subscription plan');
    }

    const planConfig = PLAN_FEATURES[dto.plan];
    const current = await this.findOrCreate(orgId);

    const updated = await this.prisma.subscription.update({
      where: { organizationId: orgId },
      data: {
        plan: dto.plan,
        status: SubscriptionStatus.ACTIVE,
        seatLimit: planConfig.seatLimit,
        features: planConfig.features,
        billingEmail: dto.billingEmail ?? current.billingEmail,
        currentPeriodStart: new Date(),
        // 30-day cycle placeholder
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.audit.log({
      action: AuditAction.SUBSCRIPTION_PLAN_CHANGED,
      userId: actorId,
      organizationId: orgId,
      meta: { from: current.plan, to: dto.plan },
    });

    return updated;
  }

  /**
   * Update billing contact email only (OWNER or ADMIN).
   */
  async updateBillingEmail(actorId: string, orgId: string, billingEmail: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: actorId, organizationId: orgId } },
    });
    if (!membership || !([MemberRole.OWNER, MemberRole.ADMIN] as MemberRole[]).includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.subscription.update({
      where: { organizationId: orgId },
      data: { billingEmail },
    });
  }

  /**
   * Check if the org can add another member (seat limit guard).
   * Returns { allowed, current, limit }
   */
  async checkSeatAvailability(orgId: string) {
    const sub = await this.findOrCreate(orgId);
    if (sub.seatLimit === -1) return { allowed: true, current: 0, limit: -1 };

    const current = await this.prisma.membership.count({
      where: { organizationId: orgId, isActive: true },
    });

    return {
      allowed: current < sub.seatLimit,
      current,
      limit: sub.seatLimit,
    };
  }

  /** Get plan features for a given plan (used by frontend). */
  getPlanFeatures() {
    return Object.entries(PLAN_FEATURES).map(([plan, config]) => ({
      plan,
      seatLimit: config.seatLimit,
      features: config.features,
    }));
  }
}
