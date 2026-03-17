'use client';

import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useAnalyticsSummary, useAnalyticsTrends } from '@/hooks/use-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, FolderKanban, CheckSquare, Mail, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Horizontal bar item ────────────────────────────────────
function BarItem({
  label,
  value,
  total,
  colorClass,
  badge,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
  badge?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{label}</span>
          {badge && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        <span className="text-muted-foreground">{value} <span className="text-[10px]">({pct}%)</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Metric tile ────────────────────────────────────────────
function MetricTile({ label, value, sub, colorClass }: {
  label: string;
  value: number | string;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold mt-0.5', colorClass)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-amber-500',
  ADMIN: 'bg-violet-500',
  MANAGER: 'bg-blue-500',
  MEMBER: 'bg-gray-400',
};

const ROLE_SEAT_LIMITS: Record<string, string> = {
  OWNER: 'Full access',
  ADMIN: 'All except billing/roles',
  MANAGER: 'Dept & project ops',
  MEMBER: 'View + task ops',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-yellow-500',
  DONE: 'bg-green-500',
  CANCELLED: 'bg-red-400',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-gray-400',
  ACTIVE: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-400',
};

export default function AdminPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: user } = useMe();
  const { data: summary, isLoading } = useAnalyticsSummary(activeOrganizationId ?? undefined);
  const { data: trends } = useAnalyticsTrends(activeOrganizationId ?? undefined);

  const myRole = user?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;

  if (myRole !== 'OWNER' && myRole !== 'ADMIN') {
    return (
      <EmptyState
        icon={Shield}
        title="Access Restricted"
        description="Only Owners and Admins can view admin analytics."
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Admin Analytics"
        description="Deep-dive insights for organization administrators"
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {summary && (
        <>
          {/* ── Member health overview ─────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Member Health
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                label="Total Members"
                value={summary.members.total}
              />
              <MetricTile
                label="Active Members"
                value={summary.members.active}
                sub={`${summary.members.total - summary.members.active} inactive`}
                colorClass="text-green-600"
              />
              <MetricTile
                label="Pending Invitations"
                value={summary.invitations.pending}
                sub={`${summary.invitations.total} total sent`}
                colorClass={summary.invitations.pending > 0 ? 'text-amber-600' : undefined}
              />
              <MetricTile
                label="Inactive Rate"
                value={`${summary.members.total > 0 ? Math.round(((summary.members.total - summary.members.active) / summary.members.total) * 100) : 0}%`}
                sub="of total members"
              />
            </div>
          </section>

          {/* ── Role distribution ──────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Role Distribution</CardTitle>
              <CardDescription>How permissions are spread across members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(summary.members.roleBreakdown).map(([role, count]) => (
                <BarItem
                  key={role}
                  label={role}
                  value={count}
                  total={summary.members.total}
                  colorClass={ROLE_COLORS[role] ?? 'bg-gray-400'}
                  badge={ROLE_SEAT_LIMITS[role]}
                />
              ))}
            </CardContent>
          </Card>

          {/* ── Projects & tasks ──────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  Project Status
                </CardTitle>
                <CardDescription>
                  {summary.projects.total} total · {summary.projects.archived} archived
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(summary.projects.statusBreakdown).map(([status, count]) => (
                  <BarItem
                    key={status}
                    label={status.replace(/_/g, ' ')}
                    value={count}
                    total={Math.max(summary.projects.total - summary.projects.archived, 1)}
                    colorClass={PROJECT_STATUS_COLORS[status] ?? 'bg-gray-400'}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  Task Breakdown
                </CardTitle>
                <CardDescription>
                  {summary.tasks.total} total · {' '}
                  <span className={summary.tasks.overdue > 0 ? 'text-destructive font-medium' : ''}>
                    {summary.tasks.overdue} overdue
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(summary.tasks.statusBreakdown).map(([status, count]) => (
                  <BarItem
                    key={status}
                    label={TASK_STATUS_LABELS[status] ?? status}
                    value={count}
                    total={summary.tasks.total || 1}
                    colorClass={TASK_STATUS_COLORS[status] ?? 'bg-gray-400'}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── Org structure ─────────────────────────── */}
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Org Structure
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricTile label="Departments" value={summary.departments.total} />
              <MetricTile label="Teams" value={summary.teams.total} />
              <MetricTile
                label="Audit Events (30d)"
                value={summary.activity.recentAuditEvents}
                sub="recent org activity"
              />
            </div>
          </section>

          {/* ── Seat usage ────────────────────────────── */}
          {myRole === 'OWNER' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Invitation Pipeline
                </CardTitle>
                <CardDescription>Current status of member invitations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-2xl font-bold text-amber-600">{summary.invitations.pending}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-2xl font-bold text-green-600">
                      {summary.invitations.total - summary.invitations.pending}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Accepted / other</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-2xl font-bold">{summary.invitations.total}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Total sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 6-month trend summary ─────────────────── */}
          {trends && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">6-Month Growth Trend</CardTitle>
                <CardDescription>Month-by-month growth signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-3 font-medium">Month</th>
                        <th className="py-2 px-2 text-right font-medium">New Members</th>
                        <th className="py-2 px-2 text-right font-medium">New Projects</th>
                        <th className="py-2 pl-2 text-right font-medium">Tasks Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends.months.map((m) => (
                        <tr key={m.label} className="border-b last:border-0">
                          <td className="py-2 pr-3 text-muted-foreground font-medium">{m.label}</td>
                          <td className="py-2 px-2 text-right">{m.newMembers}</td>
                          <td className="py-2 px-2 text-right">{m.newProjects}</td>
                          <td className="py-2 pl-2 text-right">{m.tasksCompleted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
