'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useMembers, useUpdateMemberRole } from '@/hooks/use-members';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTeams } from '@/hooks/use-teams';
import { useDepartments } from '@/hooks/use-departments';
import apiClient from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { getRoleBadgeColor, getInitials, formatDate, getApiErrorMessage } from '@/lib/utils';
import { Users, Search } from 'lucide-react';
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
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [teamId, setTeamId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState('');

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

  const setStatus = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      apiClient.patch(`/organizations/${activeOrganizationId}/members/${userId}/status`, { isActive: active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', activeOrganizationId] }),
  });

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

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
            </div>
          ) : !members?.length ? (
            <EmptyState icon={Users} title="No members found" description="Try adjusting your filters" />
          ) : (
            <div className="divide-y">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
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

                  {/* Active status dot */}
                  <span className={`h-2 w-2 rounded-full shrink-0 ${m.isActive ? 'bg-green-500' : 'bg-gray-300'}`} title={m.isActive ? 'Active' : 'Inactive'} />

                  {canManage && m.userId !== me?.id && m.role !== 'OWNER' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => setStatus.mutate({ userId: m.userId, active: !m.isActive })}
                      disabled={setStatus.isPending}
                    >
                      {m.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
