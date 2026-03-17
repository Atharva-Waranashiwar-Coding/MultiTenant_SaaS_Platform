// ─────────────────────────────────────────────────────────
// Shared TypeScript types — mirrors the API response shapes
// ─────────────────────────────────────────────────────────

export type MemberRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

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
  role?: MemberRole;  // populated when listing user's orgs
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: MemberRole;
  joinedAt: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarUrl'>;
  organization?: Organization;
}

export interface Invitation {
  id: string;
  email: string;
  organizationId: string;
  role: MemberRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  invitedBy?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
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
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> | null;
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
