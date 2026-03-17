# MultiTenant SaaS Admin Platform

A production-grade, multi-tenant SaaS admin platform built from scratch with **Next.js 14**, **NestJS**, **Prisma**, and **PostgreSQL**. Organizations create isolated workspaces, invite members, manage roles & permissions, track projects and tasks, and operate inside fully scoped dashboards — with analytics, audit trails, billing scaffolding, and file attachments.

> Built as a portfolio project to demonstrate real-world full-stack architecture across authentication, multi-tenancy, RBAC, data modelling, and modern React patterns.

---

## Live Features at a Glance

| Category | Highlights |
|---|---|
| **Auth** | JWT access + refresh token rotation, email verification, forgot/reset password |
| **Multi-tenancy** | Isolated orgs, org switcher, per-org access control on every endpoint |
| **People** | Member list with search/filter, role management, activate/deactivate, bulk actions |
| **Teams & Depts** | Hierarchical departments > teams with lead roles |
| **Projects** | Full CRUD, status/priority/tags/due dates, archive/unarchive, bulk archive |
| **Tasks** | Per-project kanban tasks, inline status editing, soft delete, bulk delete/restore |
| **Attachments** | Upload files to projects/tasks (multer), authenticated download, delete |
| **Settings** | Org branding (brand color, timezone, default invite role), profile settings |
| **Billing** | Subscription plans (FREE → ENTERPRISE), seat limits, feature flags |
| **RBAC** | Role-permission override matrix per org (OWNER/ADMIN/MANAGER/MEMBER) |
| **Analytics** | Dashboard KPIs, trend charts (members, projects, tasks over 6 months) |
| **Audit Log** | Immutable per-org activity log with filtering by action/user/date |
| **Notifications** | In-app notifications with mark-read, unread count |
| **Search** | Cross-entity full-text search (members, projects, tasks) |

---

## Architecture

```
.
├── apps/
│   ├── api/                        ← NestJS backend (port 4000)
│   │   ├── src/
│   │   │   ├── auth/               # JWT, signup, login, refresh, password reset, email verify
│   │   │   ├── users/              # User profile (PATCH /users/me)
│   │   │   ├── organizations/      # Tenant CRUD, branding, settings
│   │   │   ├── members/            # Membership management, role changes, bulk actions
│   │   │   ├── invitations/        # Token-based email invite flow
│   │   │   ├── departments/        # Department CRUD + membership
│   │   │   ├── teams/              # Team CRUD + membership, department association
│   │   │   ├── projects/           # Project CRUD, archive, bulk archive
│   │   │   ├── tasks/              # Task CRUD, comments, soft delete, bulk actions
│   │   │   ├── attachments/        # File upload/download/delete (multer disk storage)
│   │   │   ├── subscriptions/      # Billing plans, seat limits, feature flags
│   │   │   ├── roles/              # Per-org role-permission override matrix
│   │   │   ├── notifications/      # In-app notification fan-out + read tracking
│   │   │   ├── analytics/          # Org KPIs, trend data, admin insights
│   │   │   ├── search/             # Cross-entity full-text search
│   │   │   ├── audit/              # Immutable audit log with filtering
│   │   │   ├── common/             # Guards (JWT, Roles, Tenant), decorators, filters
│   │   │   └── prisma/             # PrismaService singleton
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Full data model (20+ models)
│   │   │   └── seed.ts             # Demo data (orgs, users, projects, tasks)
│   │   └── uploads/                # Local file storage (multer)
│   │
│   └── web/                        ← Next.js 14 frontend (port 3000)
│       └── src/
│           ├── app/
│           │   ├── (auth)/         # login, signup, verify-email, forgot/reset password
│           │   ├── (dashboard)/    # Protected shell with all feature pages
│           │   │   ├── dashboard/  # KPI cards + trend charts
│           │   │   ├── people/     # Member list + bulk actions
│           │   │   ├── departments/
│           │   │   ├── teams/
│           │   │   ├── projects/   # Project list + [projectId] detail with attachments
│           │   │   ├── members/    # Invitation management
│           │   │   ├── notifications/
│           │   │   ├── admin/      # Admin analytics (OWNER/ADMIN only)
│           │   │   ├── audit/      # Audit log explorer
│           │   │   └── settings/   # Org settings, billing, RBAC, profile
│           │   ├── org/            # Org create + org select
│           │   └── invite/         # Invitation acceptance
│           ├── components/
│           │   ├── ui/             # shadcn-style primitives + custom components
│           │   └── layout/         # Sidebar, topbar, notification bell
│           ├── hooks/              # TanStack Query hooks per domain
│           ├── lib/api/            # Typed Axios API clients per domain
│           ├── store/              # Zustand auth store (tokens, active org)
│           └── types/              # Shared TypeScript types mirroring API responses
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Radix UI primitives |
| **State** | TanStack Query v5 (server state), Zustand (client state) |
| **Forms** | React Hook Form + Zod |
| **Backend** | NestJS 10, TypeScript, class-validator |
| **ORM** | Prisma 5 |
| **Database** | PostgreSQL 15 |
| **Auth** | Passport.js, JWT (RS256-ready), refresh token rotation |
| **File Upload** | Multer (disk storage, auth-controlled download) |
| **API Docs** | Swagger/OpenAPI at `/api/docs` |
| **Dev Infra** | Docker Compose, GitHub Actions CI |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker + Docker Compose

### 1. Start the database

```bash
docker-compose up -d db
```

### 2. Set up the API

```bash
cd apps/api
cp .env.example .env           # edit DATABASE_URL if needed
npm install
npm install multer @types/multer   # file upload dependency
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev               # http://localhost:4000
```

### 3. Set up the web app

```bash
cd apps/web
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
npm install
npm run dev                     # http://localhost:3000
```

### URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/docs |

---

## Demo Accounts

Seeded automatically by `npx prisma db seed`:

| Email | Password | Role |
|---|---|---|
| `alice@demo.com` | `Password123!` | OWNER — Demo Corp |
| `bob@demo.com` | `Password123!` | ADMIN — Demo Corp |
| `carol@demo.com` | `Password123!` | MEMBER — Demo Corp |

The seed also creates sample projects, tasks, departments, teams, and audit entries so the dashboard is populated on first login.

---

## Running with Docker (full stack)

```bash
cp apps/api/.env.example apps/api/.env
docker-compose up --build
```

---

## API Reference

All endpoints documented at **http://localhost:4000/api/docs**.

### Key Endpoint Groups

```
# Auth
POST /auth/signup | /auth/login | /auth/logout | /auth/refresh
GET  /auth/me
PATCH /users/me
POST /auth/forgot-password | /auth/reset-password
GET  /auth/verify-email?token=...
POST /auth/switch-org

# Organizations
POST   /organizations
GET    /organizations | /organizations/:orgId
PATCH  /organizations/:orgId

# Members
GET    /organizations/:orgId/members
PATCH  /organizations/:orgId/members/:userId/role
PATCH  /organizations/:orgId/members/:userId/status
DELETE /organizations/:orgId/members/:userId
POST   /organizations/:orgId/members/bulk

# Invitations
POST   /organizations/:orgId/invitations
GET    /organizations/:orgId/invitations
DELETE /organizations/:orgId/invitations/:id
GET    /invitations/preview?token=... | POST /invitations/accept

# Teams & Departments
GET/POST   /organizations/:orgId/departments
GET/POST   /organizations/:orgId/teams

# Projects
GET/POST   /organizations/:orgId/projects
PATCH      /organizations/:orgId/projects/:id
PATCH      /organizations/:orgId/projects/:id/archive | /unarchive
POST       /organizations/:orgId/projects/bulk

# Tasks
GET/POST   /organizations/:orgId/projects/:projectId/tasks
PATCH      /organizations/:orgId/projects/:projectId/tasks/:id
DELETE     /organizations/:orgId/projects/:projectId/tasks/:id
POST       /organizations/:orgId/projects/:projectId/tasks/bulk
GET/POST   /organizations/:orgId/projects/:projectId/tasks/:id/comments

# Attachments
POST   /organizations/:orgId/attachments              (multipart/form-data)
GET    /organizations/:orgId/attachments?projectId=...
GET    /organizations/:orgId/attachments/:id/download
DELETE /organizations/:orgId/attachments/:id

# Analytics
GET /organizations/:orgId/analytics/summary
GET /organizations/:orgId/analytics/trends

# Audit
GET /organizations/:orgId/audit

# Search
GET /organizations/:orgId/search?q=...

# Notifications
GET    /notifications
PATCH  /notifications/:id/read
POST   /notifications/read-all

# Subscriptions
GET    /organizations/:orgId/subscription
POST   /organizations/:orgId/subscription/upgrade

# Roles/Permissions
GET    /organizations/:orgId/roles/permissions
PUT    /organizations/:orgId/roles/:role/permissions/:permission
```

---

## Data Model Overview

```
users
  ├── memberships ──── organizations (tenant root)
  │       └── role: OWNER | ADMIN | MANAGER | MEMBER
  │       └── isActive: boolean
  ├── refresh_tokens
  ├── invitations (email + token-based accept)
  ├── notifications
  └── uploadedAttachments

organizations
  ├── members (memberships)
  ├── departments
  │   └── teams (departmentId FK, optional)
  ├── projects
  │   ├── tasks
  │   │   ├── comments
  │   │   └── attachments (file metadata + storagePath)
  │   └── attachments
  ├── invitations
  ├── audit_logs
  ├── subscriptions
  ├── role_permission_overrides
  └── notifications

# Branding fields on Organization
  brandColor      String?           # hex color e.g. #3B82F6
  timezone        String            # IANA timezone string
  defaultInviteRole MemberRole      # default role for new invites
```

---

## Key Design Decisions

### Multi-tenancy
All data is scoped by `organizationId`. The `TenantGuard` (applied at controller level) verifies the requesting user is an active member of the target org before any handler runs — no per-endpoint tenant check needed.

### JWT Auth
Short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored in the DB and rotated on each refresh. Refresh tokens are invalidated on logout.

### File Uploads
Files are stored on local disk (`apps/api/uploads/`) via Multer. The `storagePath` column stores the path — trivial to swap for an S3 key later. Downloads go through an authenticated endpoint so anonymous access to stored files is impossible.

### Bulk Actions
Bulk endpoints filter out protected records (self, OWNERs) before executing, preventing privilege escalation even if the client sends arbitrary IDs. All bulk operations are logged to the audit trail.

### Toast Notifications
Uses a singleton reducer + listener pattern (no React context provider). `toast()`, `toast.success()`, and `toast.error()` can be called from any mutation `onSuccess`/`onError` callback without wrapping components.

### Soft Deletes
Tasks use `isDeleted`/`deletedAt`. Bulk restore flips them back. This preserves referential integrity while hiding deleted records from normal queries.

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | Refresh token TTL in days |
| `FRONTEND_URL` | Frontend URL for CORS and email links |
| `PORT` | API port (default: `4000`) |

### Web (`apps/web/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:4000/api/v1`) |

---

## Implementation Phases

### Phase 1 — Core Auth & Multi-tenancy
User auth (signup/login/refresh/logout), JWT rotation, email verification scaffold, organization CRUD, membership model (OWNER/ADMIN/MANAGER/MEMBER), email invitations, member role changes, audit logging, dashboard shell.

### Phase 2 — Organizations, Teams, Projects
Departments with leads, teams scoped to departments, full project CRUD (status/priority/tags/due dates/archive), task management with comments, per-project member management, role-based access to UI actions.

### Phase 3 — RBAC, Billing, Notifications, Search
Custom role-permission overrides per org, subscription plans with seat limits and feature flags, in-app notification system, cross-entity search endpoint, tenant isolation hardening.

### Phase 4 — Analytics, Audit Explorer, Performance
Organization analytics dashboard (KPI cards + 6-month trend charts), admin analytics overview, audit log explorer with per-action/user/date filtering, DB indexes on hot query paths, team soft-delete.

### Phase 5 — UX Polish, Bulk Actions, Attachments, Settings
Skeleton loaders, toast system, bulk select + bulk actions (members/projects/tasks), file attachments (upload/download/delete) on projects and tasks, org branding settings (brand color, timezone, default invite role), user profile settings page, improved people list.

---

## Extending This Project

**Email sending** — Both `auth.service.ts` and `invitations.service.ts` have `// TODO: send email` comments. Wire in Nodemailer, Resend, or SendGrid there.

**S3 file storage** — Replace the `diskStorage` config in `attachments.controller.ts` with an S3 upload, and swap `res.sendFile` in the download handler for a signed URL redirect.

**CASL permissions** — Replace `RolesGuard` with a CASL `AbilityGuard` to drive access control from the `role_permission_overrides` table already in the DB.

**Real-time** — Add Socket.IO to the NestJS app and emit events from service methods. The notification table already exists; push new notifications instead of polling.

**Row-level security** — Add a Prisma middleware that auto-injects `{ organizationId }` scoping to all read queries, eliminating any risk of cross-tenant data leaks.
