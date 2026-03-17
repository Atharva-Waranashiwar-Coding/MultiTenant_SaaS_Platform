'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { auditApi } from '@/lib/api/audit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/utils';
import { ShieldCheck, Filter, X } from 'lucide-react';

// All audit actions grouped by module
const ACTION_GROUPS: Record<string, { value: string; label: string }[]> = {
  User: [
    { value: 'USER_SIGNUP', label: 'Signed up' },
    { value: 'USER_LOGIN', label: 'Logged in' },
    { value: 'USER_LOGOUT', label: 'Logged out' },
    { value: 'USER_PASSWORD_RESET_REQUEST', label: 'Reset password (request)' },
    { value: 'USER_PASSWORD_RESET_COMPLETE', label: 'Reset password (complete)' },
    { value: 'USER_EMAIL_VERIFIED', label: 'Email verified' },
  ],
  Organization: [
    { value: 'ORG_CREATED', label: 'Org created' },
    { value: 'ORG_UPDATED', label: 'Org updated' },
  ],
  Members: [
    { value: 'MEMBER_INVITED', label: 'Member invited' },
    { value: 'MEMBER_INVITATION_ACCEPTED', label: 'Invite accepted' },
    { value: 'MEMBER_INVITATION_REVOKED', label: 'Invite revoked' },
    { value: 'MEMBER_REMOVED', label: 'Member removed' },
    { value: 'MEMBER_ROLE_CHANGED', label: 'Role changed' },
    { value: 'MEMBER_JOINED', label: 'Member joined' },
    { value: 'MEMBER_ACTIVATED', label: 'Member activated' },
    { value: 'MEMBER_DEACTIVATED', label: 'Member deactivated' },
  ],
  Departments: [
    { value: 'DEPARTMENT_CREATED', label: 'Dept created' },
    { value: 'DEPARTMENT_UPDATED', label: 'Dept updated' },
    { value: 'DEPARTMENT_DELETED', label: 'Dept deleted' },
    { value: 'DEPARTMENT_MEMBER_ADDED', label: 'Dept member added' },
    { value: 'DEPARTMENT_MEMBER_REMOVED', label: 'Dept member removed' },
  ],
  Teams: [
    { value: 'TEAM_CREATED', label: 'Team created' },
    { value: 'TEAM_UPDATED', label: 'Team updated' },
    { value: 'TEAM_DELETED', label: 'Team deleted' },
    { value: 'TEAM_MEMBER_ADDED', label: 'Team member added' },
    { value: 'TEAM_MEMBER_REMOVED', label: 'Team member removed' },
  ],
  Projects: [
    { value: 'PROJECT_CREATED', label: 'Project created' },
    { value: 'PROJECT_UPDATED', label: 'Project updated' },
    { value: 'PROJECT_ARCHIVED', label: 'Project archived' },
    { value: 'PROJECT_UNARCHIVED', label: 'Project unarchived' },
    { value: 'PROJECT_MEMBER_ADDED', label: 'Project member added' },
    { value: 'PROJECT_MEMBER_REMOVED', label: 'Project member removed' },
  ],
  Tasks: [
    { value: 'TASK_CREATED', label: 'Task created' },
    { value: 'TASK_UPDATED', label: 'Task updated' },
    { value: 'TASK_STATUS_CHANGED', label: 'Task status changed' },
    { value: 'TASK_DELETED', label: 'Task deleted' },
    { value: 'TASK_ASSIGNED', label: 'Task assigned' },
    { value: 'TASK_COMMENT_ADDED', label: 'Comment added' },
  ],
  'Permissions & Billing': [
    { value: 'PERMISSION_OVERRIDE_CREATED', label: 'Permission override created' },
    { value: 'PERMISSION_OVERRIDE_DELETED', label: 'Permission override deleted' },
    { value: 'SUBSCRIPTION_PLAN_CHANGED', label: 'Subscription plan changed' },
  ],
};

const ALL_ACTIONS = Object.values(ACTION_GROUPS).flat();
const ACTION_LABEL_MAP = Object.fromEntries(ALL_ACTIONS.map((a) => [a.value, a.label]));

interface Filters {
  search: string;
  action: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: Filters = { search: '', action: '', dateFrom: '', dateTo: '' };

export default function AuditPage() {
  const { activeOrganizationId } = useAuthStore();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', activeOrganizationId, applied, page],
    queryFn: () =>
      auditApi.list(activeOrganizationId!, {
        search: applied.search || undefined,
        action: applied.action || undefined,
        dateFrom: applied.dateFrom || undefined,
        dateTo: applied.dateTo || undefined,
        page,
        limit: 25,
      }),
    enabled: !!activeOrganizationId,
  });

  const logs = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const applyFilters = useCallback(() => {
    setApplied({ ...filters });
    setPage(1);
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const hasActiveFilters =
    applied.search || applied.action || applied.dateFrom || applied.dateTo;

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Audit Log" description="Track all activity in your organization">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              !
            </span>
          )}
        </Button>
      </PageHeader>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Search user</Label>
                <Input
                  placeholder="Name or email..."
                  className="h-8 text-sm"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(v) => setFilters((f) => ({ ...f, action: v === '_all' ? '' : v }))}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Any action" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Any action</SelectItem>
                    {Object.entries(ACTION_GROUPS).map(([group, actions]) => (
                      <div key={group}>
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">{group}</div>
                        {actions.map((a) => (
                          <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">From date</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">To date</Label>
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={applyFilters}>Apply</Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {isLoading ? 'Loading…' : `${total} event${total !== 1 ? 's' : ''}`}
          </CardTitle>
          <CardDescription>
            {hasActiveFilters ? 'Filtered results' : 'All organization activity, newest first'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-px p-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !logs.length ? (
            <EmptyState
              icon={ShieldCheck}
              title="No events found"
              description={hasActiveFilters ? 'Try adjusting your filters.' : 'No activity yet.'}
            />
          ) : (
            <div>
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 border-b last:border-0 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {ACTION_LABEL_MAP[log.action] ?? log.action}
                    </p>
                    {log.user && (
                      <p className="text-xs text-muted-foreground">
                        {log.user.firstName} {log.user.lastName}
                        <span className="mx-1">·</span>
                        {log.user.email}
                      </p>
                    )}
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono truncate">
                        {JSON.stringify(log.meta)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
