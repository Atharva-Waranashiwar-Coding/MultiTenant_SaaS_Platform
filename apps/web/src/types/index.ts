// ─────────────────────────────────────────────────────────
// Shared TypeScript types — mirrors the API response shapes
// ─────────────────────────────────────────────────────────

export type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
// Phase 2
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  memberships?: Membership[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  role?: MemberRole;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  isActive: boolean;
  joinedAt: string;
  user?: UserSummary & {
    teamMembers?: { team: { id: string; name: string }; isLead: boolean }[];
    departmentMembers?: { department: { id: string; name: string }; isLead: boolean }[];
  };
  organization?: Organization;
}

export type UserSummary = Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarUrl'>;

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: MemberRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  invitedBy?: UserSummary;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl'>;
}

export interface AuditLog {
  id: string;
  action: string;
  userId?: string | null;
  organizationId?: string | null;
  targetUserId?: string | null;
  meta?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: UserSummary | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// ── Phase 2 types ─────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; teams: number };
  members?: DepartmentMember[];
  teams?: { id: string; name: string; _count: { members: number } }[];
}

export interface DepartmentMember {
  id: string;
  userId: string;
  departmentId: string;
  isLead: boolean;
  joinedAt: string;
  user?: UserSummary;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  departmentId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  department?: { id: string; name: string } | null;
  _count?: { members: number };
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  isLead: boolean;
  joinedAt: string;
  user?: UserSummary;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: Priority;
  dueDate?: string | null;
  tags: string[];
  organizationId: string;
  ownerId: string;
  createdById: string;
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary;
  createdBy?: UserSummary;
  members?: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number; members: number };
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  joinedAt: string;
  user?: UserSummary;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  tags: string[];
  projectId: string;
  assigneeId?: string | null;
  createdById: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: UserSummary | null;
  createdBy?: UserSummary;
  comments?: TaskComment[];
  _count?: { comments: number };
}

export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
}

// ── Phase 3 types ──────────────────────────────────────────

export type SubscriptionPlan = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
export type NotificationType =
  | 'INVITE_ACCEPTED'
  | 'MEMBER_ADDED'
  | 'MEMBER_ROLE_CHANGED'
  | 'PROJECT_ASSIGNED'
  | 'TASK_ASSIGNED'
  | 'TASK_DUE_SOON';

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  seatLimit: number;
  trialStartAt?: string | null;
  trialEndAt?: string | null;
  billingEmail?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  features: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  plan: SubscriptionPlan;
  seatLimit: number;
  features: Record<string, boolean>;
}

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RolePermissionOverride {
  id: string;
  organizationId: string;
  role: MemberRole;
  permission: string;
  granted: boolean;
  createdAt: string;
}

// ── Phase 4 types ──────────────────────────────────────────

export interface AnalyticsSummary {
  members: {
    total: number;
    active: number;
    inactive: number;
    roleBreakdown: Record<MemberRole, number>;
  };
  teams: { total: number };
  departments: { total: number };
  invitations: { total: number; pending: number };
  projects: {
    total: number;
    active: number;
    archived: number;
    statusBreakdown: Record<string, number>;
  };
  tasks: {
    total: number;
    overdue: number;
    statusBreakdown: Record<string, number>;
  };
  activity: { recentAuditEvents: number };
}

export interface TrendMonth {
  label: string;
  newMembers: number;
  newProjects: number;
  tasksCompleted: number;
}

export interface AnalyticsTrends {
  months: TrendMonth[];
}
