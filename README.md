# MultiTenant SaaS Admin Platform

A production-style multi-tenant SaaS admin platform built with Next.js, NestJS, Prisma, and PostgreSQL. Organizations can create workspaces, invite members, manage roles, and operate inside tenant-scoped dashboards.

---

## Architecture

```
.
├── apps/
│   ├── api/          ← NestJS backend (port 4000)
│   │   ├── src/
│   │   │   ├── auth/             # JWT auth, signup, login, refresh, password reset
│   │   │   ├── users/            # User profile management
│   │   │   ├── organizations/    # Tenant CRUD
│   │   │   ├── members/          # Membership management, role changes
│   │   │   ├── invitations/      # Invite flow
│   │   │   ├── audit/            # Immutable activity log
│   │   │   ├── common/           # Guards, decorators, filters
│   │   │   └── prisma/           # Prisma service
│   │   └── prisma/
│   │       ├── schema.prisma     # Full data model
│   │       └── seed.ts           # Demo data
│   └── web/          ← Next.js 14 frontend (port 3000)
│       └── src/
│           ├── app/              # App Router pages
│           │   ├── (auth)/       # login, signup, forgot/reset password
│           │   ├── (dashboard)/  # Protected: dashboard, members, settings, audit
│           │   ├── org/          # Org create + select
│           │   └── invite/       # Invitation acceptance
│           ├── components/       # UI components + layout
│           ├── hooks/            # TanStack Query hooks
│           ├── lib/              # Axios client, API services, utils
│           ├── store/            # Zustand auth store
│           └── types/            # Shared TypeScript types
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| State | TanStack Query v5, Zustand |
| Forms | React Hook Form + Zod |
| Backend | NestJS, TypeScript, Passport.js |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 |
| Auth | JWT (access + refresh token rotation) |
| Docs | Swagger/OpenAPI at `/api/docs` |
| Dev Infra | Docker, docker-compose, GitHub Actions |

---

## Local Development (Recommended)

### Prerequisites

- Node.js 20+
- Docker + Docker Compose

### Step 1: Start the database

```bash
docker-compose up -d db
```

### Step 2: Set up the API

```bash
cd apps/api
cp .env.example .env         # edit if needed
npm install
npx prisma migrate dev --name init   # creates tables
npx prisma db seed                   # loads demo data
npm run start:dev            # starts on port 4000
```

### Step 3: Set up the web app

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev                  # starts on port 3000
```

### Access the app

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/docs |

### Demo accounts (from seed)

| Email | Password | Role |
|---|---|---|
| alice@demo.com | Password123! | OWNER of Demo Corp |
| bob@demo.com | Password123! | MEMBER of Demo Corp |

---

## Running with Docker (full stack)

```bash
cp apps/api/.env.example apps/api/.env
docker-compose up --build
```

---

## API Reference

All endpoints are documented at **http://localhost:4000/api/docs** via Swagger.

### Key Endpoints

```
# Auth
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/verify-email?token=...
POST /api/v1/auth/switch-org

# Organizations
POST   /api/v1/organizations
GET    /api/v1/organizations
GET    /api/v1/organizations/:orgId
PATCH  /api/v1/organizations/:orgId

# Members
GET    /api/v1/organizations/:orgId/members
PATCH  /api/v1/organizations/:orgId/members/:userId/role
DELETE /api/v1/organizations/:orgId/members/:userId

# Invitations
POST   /api/v1/organizations/:orgId/invitations
GET    /api/v1/organizations/:orgId/invitations
DELETE /api/v1/organizations/:orgId/invitations/:invitationId
GET    /api/v1/invitations/preview?token=...
POST   /api/v1/invitations/accept

# Audit
GET    /api/v1/organizations/:orgId/audit
```

---

## Data Model

```
users ─────────────── memberships ──── organizations
  │                        │
  │                        └── role: OWNER | ADMIN | MANAGER | MEMBER
  │
  └── invitations (email-based, token flow)
  └── refresh_tokens (stored, rotated)
  └── audit_logs (immutable event history)
```

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | Refresh token TTL in days |
| `FRONTEND_URL` | Frontend URL (CORS + email links) |
| `PORT` | API port (default: 4000) |

### Web (`apps/web/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## Phase 1 — What's implemented

- [x] Project structure (monorepo-style)
- [x] Docker + docker-compose for local dev
- [x] GitHub Actions CI
- [x] User signup + login + logout
- [x] JWT access tokens + refresh token rotation
- [x] Forgot + reset password (scaffolded, logs token to console in dev)
- [x] Email verification (scaffolded, token logged to console)
- [x] Current user endpoint with memberships
- [x] Organization (tenant) create, list, get, update
- [x] Tenant-scoped data model (all tenant data scoped by `organizationId`)
- [x] Membership model with OWNER / ADMIN / MANAGER / MEMBER roles
- [x] Email invitations with token-based acceptance
- [x] Invitation statuses: PENDING / ACCEPTED / EXPIRED / REVOKED
- [x] Member role changes (with hierarchy rules)
- [x] Member removal
- [x] Audit log for all key Phase 1 actions
- [x] Role-based guards on backend (RolesGuard)
- [x] Frontend protected routes (middleware + layout guard)
- [x] Frontend role-based UI (hide invite/remove from non-admins)
- [x] Dashboard shell with sidebar + topbar
- [x] Dashboard stats page
- [x] Members management page
- [x] Organization settings page
- [x] Audit log viewer page
- [x] Org create + org switcher pages
- [x] Invitation acceptance page
- [x] Swagger/OpenAPI documentation
- [x] Seed data for demo

---

## Phase 2 — What's next

- [ ] Email sending (Nodemailer / SendGrid / Resend)
- [ ] Email verification enforcement
- [ ] User profile page (avatar upload)
- [ ] Organization deletion + ownership transfer
- [ ] Leave organization
- [ ] Custom permission matrix per role
- [ ] Projects / workspaces within organizations
- [ ] File uploads (S3 / Cloudflare R2)
- [ ] Background jobs (Bull/BullMQ)
- [ ] Redis caching
- [ ] Billing integration (Stripe)
- [ ] Advanced analytics + reporting
- [ ] Notification system (in-app + email)
- [ ] SAML/SSO
- [ ] API rate limiting
- [ ] Tenant data export

---

## Notes for Phase 2 Extensibility

**Email sending:** The backend already logs tokens to console. Wire in a mailer service in `auth.service.ts` and `invitations.service.ts` — both have `// Phase 2:` comments marking the exact spots.

**Strict tenant isolation:** All tenant-scoped queries already filter by `organizationId`. To enforce row-level security in PostgreSQL, add Prisma middleware that auto-injects tenant context.

**RBAC expansion:** The `RolesGuard` uses a simple hierarchy. For a custom permission matrix, replace with an `AbilityGuard` using CASL.

**Soft deletes:** Add `deletedAt DateTime?` to models and a Prisma middleware that filters deleted records globally.
