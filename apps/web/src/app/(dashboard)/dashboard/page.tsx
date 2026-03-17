'use client';

import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useAnalyticsSummary, useAnalyticsTrends } from '@/hooks/use-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Building2,
  UsersRound,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tiny sparkline using inline SVG ────────────────────────
function Sparkline({ values, color = 'currentColor' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 80;
  const h = 28;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat card ──────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconClass,
  trend,
}: {
  title: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  iconClass?: string;
  trend?: number[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4 text-muted-foreground', iconClass)} />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          {trend && <Sparkline values={trend} />}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Mini bar chart ─────────────────────────────────────────
function MiniBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 truncate text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', colorClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right font-medium">{value}</span>
    </div>
  );
}

// ── Trend table ────────────────────────────────────────────
function TrendRow({ label, newMembers, newProjects, tasksCompleted }: {
  label: string;
  newMembers: number;
  newProjects: number;
  tasksCompleted: number;
}) {
  return (
    <tr className="border-b last:border-0 text-xs">
      <td className="py-2 pr-3 text-muted-foreground font-medium">{label}</td>
      <td className="py-2 px-2 text-right">{newMembers}</td>
      <td className="py-2 px-2 text-right">{newProjects}</td>
      <td className="py-2 pl-2 text-right">{tasksCompleted}</td>
    </tr>
  );
}

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

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-amber-500',
  ADMIN: 'bg-violet-500',
  MANAGER: 'bg-blue-500',
  MEMBER: 'bg-gray-400',
};

export default function DashboardPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: user } = useMe();
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(activeOrganizationId ?? undefined);
  const { data: trends } = useAnalyticsTrends(activeOrganizationId ?? undefined);

  const activeOrg = user?.memberships?.find((m) => m.organizationId === activeOrganizationId);

  const memberTrend = trends?.months.map((m) => m.newMembers);
  const projectTrend = trends?.months.map((m) => m.newProjects);
  const taskTrend = trends?.months.map((m) => m.tasksCompleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName ?? '…'}. Overview for{' '}
          <span className="font-medium text-foreground">
            {activeOrg?.organization?.name ?? 'your organization'}
          </span>.
        </p>
      </div>

      {/* Skeleton placeholders while loading */}
      {summaryLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 w-20 animate-pulse rounded bg-muted mb-2" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {summary && (
        <>
          {/* ── Primary stat cards ─────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Members"
              value={summary.members.total}
              sub={`${summary.members.active} active`}
              icon={Users}
              trend={memberTrend}
            />
            <StatCard
              title="Teams"
              value={summary.teams.total}
              sub="across your org"
              icon={UsersRound}
            />
            <StatCard
              title="Departments"
              value={summary.departments.total}
              sub="org departments"
              icon={Building2}
            />
            <StatCard
              title="Pending Invites"
              value={summary.invitations.pending}
              sub={`${summary.invitations.total} total sent`}
              icon={Mail}
              iconClass={summary.invitations.pending > 0 ? 'text-amber-500' : ''}
            />
            <StatCard
              title="Active Projects"
              value={summary.projects.active}
              sub={`${summary.projects.total} total, ${summary.projects.archived} archived`}
              icon={FolderKanban}
              trend={projectTrend}
            />
            <StatCard
              title="Total Tasks"
              value={summary.tasks.total}
              sub={`${summary.tasks.statusBreakdown['DONE'] ?? 0} completed`}
              icon={CheckSquare}
              trend={taskTrend}
            />
            <StatCard
              title="Overdue Tasks"
              value={summary.tasks.overdue}
              sub="past due date"
              icon={AlertTriangle}
              iconClass={summary.tasks.overdue > 0 ? 'text-destructive' : ''}
            />
            <StatCard
              title="Audit Events (30d)"
              value={summary.activity.recentAuditEvents}
              sub="recent activity"
              icon={TrendingUp}
            />
          </div>

          {/* ── Breakdowns row ─────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Task status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Task Status</CardTitle>
                <CardDescription>Distribution across all projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(summary.tasks.statusBreakdown).map(([status, count]) => (
                  <MiniBar
                    key={status}
                    label={TASK_STATUS_LABELS[status] ?? status}
                    value={count}
                    max={summary.tasks.total || 1}
                    colorClass={TASK_STATUS_COLORS[status] ?? 'bg-gray-400'}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Project status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Project Status</CardTitle>
                <CardDescription>Active project lifecycle breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(summary.projects.statusBreakdown).map(([status, count]) => (
                  <MiniBar
                    key={status}
                    label={status.replace(/_/g, ' ')}
                    value={count}
                    max={summary.projects.total - summary.projects.archived || 1}
                    colorClass="bg-blue-500"
                  />
                ))}
              </CardContent>
            </Card>

            {/* Role distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Member Roles</CardTitle>
                <CardDescription>Role distribution in this org</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(summary.members.roleBreakdown).map(([role, count]) => (
                  <MiniBar
                    key={role}
                    label={role}
                    value={count}
                    max={summary.members.total || 1}
                    colorClass={ROLE_COLORS[role] ?? 'bg-gray-400'}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* ── 6-month trends ────────────────────────── */}
          {trends && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">6-Month Trends</CardTitle>
                <CardDescription>New members, projects created, and tasks completed per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-2 pr-3 font-medium">Month</th>
                        <th className="py-2 px-2 text-right font-medium">New Members</th>
                        <th className="py-2 px-2 text-right font-medium">New Projects</th>
                        <th className="py-2 pl-2 text-right font-medium">Tasks Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trends.months.map((m) => (
                        <TrendRow key={m.label} {...m} />
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
