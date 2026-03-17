// Shape of data encoded into the JWT access token.
// Keep it small — only IDs + active organization context.
export interface JwtPayload {
  sub: string;            // userId
  email: string;
  organizationId?: string; // active tenant (can be null if user has no org yet)
}
