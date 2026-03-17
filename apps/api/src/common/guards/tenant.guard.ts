import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * TenantGuard — Strict cross-tenant access prevention.
 *
 * Every route under /organizations/:orgId/... must verify that the
 * :orgId in the URL matches the organizationId encoded in the JWT.
 *
 * Without this check, a user whose JWT says "org-A" could call
 *   GET /organizations/org-B/members
 * and the RolesGuard would validate their role in org-A, then the
 * service would return org-B's data. This guard closes that gap.
 *
 * Usage: @UseGuards(TenantGuard) on any controller with :orgId param.
 * Always apply BEFORE RolesGuard: @UseGuards(TenantGuard, RolesGuard).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;           // populated by JwtAuthGuard
    const orgId = request.params?.orgId; // from route :orgId

    if (!orgId) return true; // route has no :orgId param — skip

    if (!user?.organizationId) {
      throw new ForbiddenException('No active organization context in token');
    }

    if (user.organizationId !== orgId) {
      throw new ForbiddenException('Token organization does not match requested resource');
    }

    return true;
  }
}
