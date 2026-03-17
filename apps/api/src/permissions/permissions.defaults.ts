// ─────────────────────────────────────────────────────────────────
// Default role → permission mapping.
// This is the source of truth for base-role permissions.
// Org admins can override these per-role via RolePermissionOverride.
// ─────────────────────────────────────────────────────────────────

import { MemberRole } from '@prisma/client';
import { ALL_PERMISSIONS, Permission, PERMISSIONS } from './permissions.constants';

// MEMBER: read-only access + own task creation/editing
const MEMBER_PERMISSIONS: Permission[] = [
  PERMISSIONS.MEMBERS_VIEW,
  PERMISSIONS.DEPARTMENTS_VIEW,
  PERMISSIONS.TEAMS_VIEW,
  PERMISSIONS.PROJECTS_VIEW,
  PERMISSIONS.TASKS_VIEW,
  PERMISSIONS.TASKS_CREATE,
  PERMISSIONS.TASKS_UPDATE,
  PERMISSIONS.SETTINGS_VIEW,
];

// MANAGER: can create/manage content but not members/billing/audit
const MANAGER_PERMISSIONS: Permission[] = [
  ...MEMBER_PERMISSIONS,
  PERMISSIONS.MEMBERS_INVITE,
  PERMISSIONS.DEPARTMENTS_CREATE,
  PERMISSIONS.DEPARTMENTS_UPDATE,
  PERMISSIONS.DEPARTMENTS_MANAGE_MEMBERS,
  PERMISSIONS.TEAMS_CREATE,
  PERMISSIONS.TEAMS_UPDATE,
  PERMISSIONS.TEAMS_MANAGE_MEMBERS,
  PERMISSIONS.PROJECTS_CREATE,
  PERMISSIONS.PROJECTS_UPDATE,
  PERMISSIONS.PROJECTS_ARCHIVE,
  PERMISSIONS.PROJECTS_MANAGE_MEMBERS,
  PERMISSIONS.TASKS_DELETE,
  PERMISSIONS.TASKS_ASSIGN,
];

// ADMIN: everything except billing write and roles management
const ADMIN_PERMISSIONS: Permission[] = ALL_PERMISSIONS.filter(
  (p) => p !== PERMISSIONS.BILLING_UPDATE && p !== PERMISSIONS.ROLES_MANAGE,
);

// OWNER: full access
const OWNER_PERMISSIONS: Permission[] = ALL_PERMISSIONS;

export const DEFAULT_ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  [MemberRole.OWNER]:   OWNER_PERMISSIONS,
  [MemberRole.ADMIN]:   ADMIN_PERMISSIONS,
  [MemberRole.MANAGER]: MANAGER_PERMISSIONS,
  [MemberRole.MEMBER]:  MEMBER_PERMISSIONS,
};
