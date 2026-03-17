// ─────────────────────────────────────────────────────────────────
// Permission constants — string-based for DB flexibility.
// Format: "<module>.<action>"
// These are the only valid permission strings in the system.
// ─────────────────────────────────────────────────────────────────

export const PERMISSIONS = {
  // Members
  MEMBERS_VIEW:        'members.view',
  MEMBERS_INVITE:      'members.invite',
  MEMBERS_UPDATE_ROLE: 'members.update_role',
  MEMBERS_DEACTIVATE:  'members.deactivate',
  MEMBERS_REMOVE:      'members.remove',

  // Departments
  DEPARTMENTS_VIEW:           'departments.view',
  DEPARTMENTS_CREATE:         'departments.create',
  DEPARTMENTS_UPDATE:         'departments.update',
  DEPARTMENTS_DELETE:         'departments.delete',
  DEPARTMENTS_MANAGE_MEMBERS: 'departments.manage_members',

  // Teams
  TEAMS_VIEW:           'teams.view',
  TEAMS_CREATE:         'teams.create',
  TEAMS_UPDATE:         'teams.update',
  TEAMS_DELETE:         'teams.delete',
  TEAMS_MANAGE_MEMBERS: 'teams.manage_members',

  // Projects
  PROJECTS_VIEW:           'projects.view',
  PROJECTS_CREATE:         'projects.create',
  PROJECTS_UPDATE:         'projects.update',
  PROJECTS_DELETE:         'projects.delete',
  PROJECTS_ARCHIVE:        'projects.archive',
  PROJECTS_MANAGE_MEMBERS: 'projects.manage_members',

  // Tasks
  TASKS_VIEW:   'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  TASKS_ASSIGN: 'tasks.assign',

  // Settings
  SETTINGS_VIEW:   'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // Billing
  BILLING_VIEW:   'billing.view',
  BILLING_UPDATE: 'billing.update',

  // Audit
  AUDIT_VIEW: 'audit.view',

  // Roles / permissions management
  ROLES_MANAGE: 'roles.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];
