import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../../permissions/permissions.service';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Permission } from '../../permissions/permissions.constants';

/**
 * PermissionsGuard — checks the @RequirePermission() decorator.
 *
 * Must run AFTER JwtAuthGuard (so req.user is populated) and optionally
 * AFTER TenantGuard (so we know the orgId is valid).
 *
 * Usage:
 *   @UseGuards(TenantGuard, PermissionsGuard)
 *   @RequirePermission(PERMISSIONS.PROJECTS_CREATE)
 *   create(...) {}
 *
 * If no @RequirePermission decorator is present, the guard passes.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<Permission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) return true; // no permission required

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId: string = request.params?.orgId ?? user?.organizationId;

    if (!user || !orgId) {
      throw new ForbiddenException('Missing user or organization context');
    }

    const allowed = await this.permissionsService.can(user.sub, orgId, requiredPermission);

    if (!allowed) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    return true;
  }
}
