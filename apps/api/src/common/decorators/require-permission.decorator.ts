import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../permissions/permissions.constants';

export const PERMISSION_KEY = 'required_permission';

/**
 * Marks a route as requiring a specific permission.
 * Works alongside PermissionsGuard.
 *
 * Usage: @RequirePermission(PERMISSIONS.PROJECTS_CREATE)
 */
export const RequirePermission = (permission: Permission) =>
  SetMetadata(PERMISSION_KEY, permission);
