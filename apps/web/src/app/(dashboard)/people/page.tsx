'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useMembers, useSetMemberActive, useBulkMemberAction } from '@/hooks/use-members';
import { useTeams } from '@/hooks/use-teams';
import { useDepartments } from '@/hooks/use-departments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { getRoleBadgeColor, getInitials, getApiErrorMessage } from '@/lib/utils';
import { Users, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { MemberRole } from '@/types';

const ROLES: { value: string; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'MEMBER', label: 'Member' },
];

const ACTIVE_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function PeoplePage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [teamId, setTeamId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: members, isLoading } = useMembers(activeOrganizationId ?? undefined, {
    search: search || undefined,
    role: (role as MemberRole) || undefined,
    teamId: teamId || undefined,
    departmentId: departmentId || undefined,
    isActive: isActive !== '' ? isActive === 'true' : undefined,
  });
  const { data: teams } = useTeams(activeOrganizationId ?? undefined);
  const { data: departments } = useDepartments(activeOrganizationId ?? undefined);

  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  const setStatus = useSetMemberActive(activeOrganizationId!);
  const bulkAction = useBulkMemberAction(activeOrganizationId!);

  // Selection helpers
  const bulkEligible = members?.filter(
    (m) => m.userId !== me?.id && m.role !== 'OWNER',
  ) ?? [];

  const allSelected =
    bulkEligible.length > 0 && bulkEligible.every((m) => selectedIds.has(m.userId));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(bulkEligible.map((m) => m.userId)));
    }
  };

  const toggleOne = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulk = (action: 'activate' | 'deactivate' | 'remove') => {
    bulkAction.mutate(
      { userIds: [...selectedIds], action },
      {
        onSuccess: (data) => {
          toast.success(`${data.affected} member${data.affected !== 1 ? 's' : ''} ${action}d`);
          clearSelection();
        },
        onError: (e) => toast.error('Bulk action failed', getApiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="People"
        description="Browse and manage everyone in your organization"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All departments</SelectItem>
            {departments?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Team" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All teams</SelectItem>
            {teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {canManage && (
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>{ACTIVE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      {/* Bulk action bar */}
      {canManage && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={clearSelection}
          actions={[
            {
              label: 'Activate',
              variant: 'outline',
              onClick: () => handleBulk('activate'),
              disabled: bulkAction.isPending,
            },
            {
              label: 'Deactivate',
              variant: 'outline',
              onClick: () => handleBulk('deactivate'),
              disabled: bulkAction.isPending,
            },
            {
              label: 'Remove',
              variant: 'destructive',
              onClick: () => handleBulk('remove'),
              disabled: bulkAction.isPending,
            },
          ]}
        />
      )}

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : !members?.length ? (
            <EmptyState icon={Users} title="No members found" description="Try adjusting your filters" />
          ) : (
            <div className="divide-y">
              {/* Select-all header row (only when canManage) */}
              {canManage && bulkEligible.length > 0 && (
                <div className="flex items-center gap-4 px-5 py-2 bg-muted/20">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                  <span className="text-xs text-muted-foreground">Select all eligible</span>
                </div>
              )}

              {members.map((m) => {
                const isEligible = m.userId !== me?.id && m.role !== 'OWNER';
                const isSelected = selectedIds.has(m.userId);

                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    {/* Checkbox (only for eligible members when canManage) */}
                    {canManage && (
                      <div className="w-5 shrink-0">
                        {isEligible && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(m.userId)}
                            aria-label={`Select ${m.user?.firstName}`}
                          />
                        )}
                      </div>
                    )}

                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={m.user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {m.user ? getInitials(m.user.firstName, m.user.lastName) : '?'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <Link href={`/people/${m.userId}`} className="text-sm font-medium hover:underline truncate block">
                        {m.user?.firstName} {m.user?.lastName}
                        {m.userId === me?.id && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
                    </div>

                    {/* Teams & Depts */}
                    <div className="hidden md:flex flex-wrap gap-1 max-w-[180px]">
                      {m.user?.departmentMembers?.slice(0, 2).map((dm) => (
                        <span key={dm.department.id} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {dm.department.name}
                        </span>
                      ))}
                      {m.user?.teamMembers?.slice(0, 2).map((tm) => (
                        <span key={tm.team.id} className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs">
                          {tm.team.name}
                        </span>
                      ))}
                    </div>

                    <span className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeColor(m.role)}`}>
                      {m.role}
                    </span>

                    <span className={`h-2 w-2 rounded-full shrink-0 ${m.isActive ? 'bg-green-500' : 'bg-gray-300'}`} title={m.isActive ? 'Active' : 'Inactive'} />

                    {canManage && isEligible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs shrink-0"
                        onClick={() =>
                          setStatus.mutate(
                            { userId: m.userId, isActive: !m.isActive },
                            {
                              onSuccess: () => toast.success(m.isActive ? 'Member deactivated' : 'Member activated'),
                              onError: (e) => toast.error('Failed', getApiErrorMessage(e)),
                            },
                          )
                        }
                        disabled={setStatus.isPending}
                      >
                        {m.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
