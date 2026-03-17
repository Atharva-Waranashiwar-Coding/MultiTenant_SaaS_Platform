import { Injectable } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { Permission } from './permissions.constants';
import { DEFAULT_ROLE_PERMISSIONS } from './permissions.defaults';

@Injectable()
export class PermissionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Check whether a user has a specific permission within an org.
   *
   * Resolution order:
   *  1. Find the user's MemberRole in the org.
   *  2. Get the default permission set for that role.
   *  3. Apply any org-specific overrides (granted=false revokes, granted=true grants extra).
   *  4. Return whether the permission is in the final set.
   */
  async can(userId: string, orgId: string, permission: Permission): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (!membership || !membership.isActive) return false;

    const defaults = DEFAULT_ROLE_PERMISSIONS[membership.role] ?? [];

    // Fetch org-specific overrides for this role
    const overrides = await this.prisma.rolePermissionOverride.findMany({
      where: { organizationId: orgId, role: membership.role, permission },
    });

    if (overrides.length === 0) {
      return defaults.includes(permission);
    }

    // Override found — the DB record wins
    const override = overrides[0];
    return override.granted;
  }

  /**
   * Bulk permission check — returns a map of permission → boolean.
   * Used by the frontend to gate UI elements without N requests.
   */
  async getAll(userId: string, orgId: string): Promise<Record<string, boolean>> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (!membership || !membership.isActive) return {};

    const defaults = DEFAULT_ROLE_PERMISSIONS[membership.role] ?? [];

    const overrides = await this.prisma.rolePermissionOverride.findMany({
      where: { organizationId: orgId, role: membership.role },
    });

    const overrideMap = new Map<string, boolean>(overrides.map((o) => [o.permission, o.granted]));

    const result: Record<string, boolean> = {};
    const allDefaults = new Set<string>(defaults);

    // Start with defaults
    for (const perm of defaults) {
      result[perm] = true;
    }
    // Apply overrides — override wins over default
    for (const [perm, granted] of overrideMap.entries()) {
      result[perm] = granted;
    }

    return result;
  }

  /**
   * List overrides for an org (admin view).
   */
  listOverrides(orgId: string) {
    return this.prisma.rolePermissionOverride.findMany({
      where: { organizationId: orgId },
      orderBy: [{ role: 'asc' }, { permission: 'asc' }],
    });
  }

  /**
   * Upsert an override. Only OWNER can call this.
   */
  async upsertOverride(
    actorId: string,
    orgId: string,
    role: MemberRole,
    permission: string,
    granted: boolean,
  ) {
    const result = await this.prisma.rolePermissionOverride.upsert({
      where: { organizationId_role_permission: { organizationId: orgId, role, permission } },
      create: { organizationId: orgId, role, permission, granted },
      update: { granted },
    });

    await this.audit.log({
      action: AuditAction.PERMISSION_OVERRIDE_CREATED,
      userId: actorId,
      organizationId: orgId,
      meta: { role, permission, granted },
    });

    return result;
  }

  /**
   * Delete an override (reverts to default).
   */
  async deleteOverride(actorId: string, orgId: string, overrideId: string) {
    const existing = await this.prisma.rolePermissionOverride.findFirst({
      where: { id: overrideId, organizationId: orgId },
    });
    if (!existing) return;

    await this.prisma.rolePermissionOverride.delete({ where: { id: overrideId } });

    await this.audit.log({
      action: AuditAction.PERMISSION_OVERRIDE_DELETED,
      userId: actorId,
      organizationId: orgId,
      meta: { role: existing.role, permission: existing.permission },
    });
  }
}
