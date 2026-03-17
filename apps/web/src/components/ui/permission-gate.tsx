'use client';

import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
  /** Permission string, e.g. "projects.create" */
  permission: string;
  /** Rendered when the user has the permission */
  children: React.ReactNode;
  /** Optional fallback rendered when the user lacks permission */
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the current user has the given permission.
 *
 * Usage:
 *   <PermissionGate permission="projects.create">
 *     <Button>New project</Button>
 *   </PermissionGate>
 *
 * While permissions are loading, renders nothing (no flash of unwanted UI).
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { activeOrganizationId } = useAuthStore();
  const { can, isLoading } = usePermissions(activeOrganizationId ?? undefined);

  if (isLoading) return null;
  if (!can(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
