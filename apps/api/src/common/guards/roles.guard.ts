import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

// Checks the user's membership role within the active organization.
// Requires JwtAuthGuard to have already run (populates req.user).
// The JWT payload must include organizationId (the active tenant).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator means no role restriction
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organizationId) {
      throw new ForbiddenException('No active organization context');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.sub,
          organizationId: user.organizationId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const roleHierarchy: Record<MemberRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      MANAGER: 2,
      MEMBER: 1,
    };

    const userLevel = roleHierarchy[membership.role] ?? 0;
    const minRequired = Math.min(...requiredRoles.map((r) => roleHierarchy[r] ?? 99));

    if (userLevel < minRequired) {
      throw new ForbiddenException('Insufficient role for this action');
    }

    // Attach membership to request for downstream use
    request.membership = membership;
    return true;
  }
}
