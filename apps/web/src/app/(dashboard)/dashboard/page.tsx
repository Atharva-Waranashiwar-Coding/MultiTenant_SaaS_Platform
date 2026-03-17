'use client';

import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useMembers } from '@/hooks/use-members';
import { useInvitations } from '@/hooks/use-invitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: user } = useMe();
  const { data: members } = useMembers(activeOrganizationId ?? undefined);
  const { data: invitations } = useInvitations(activeOrganizationId ?? undefined);

  const activeOrg = user?.memberships?.find((m) => m.organizationId === activeOrganizationId);
  const pendingInvites = invitations?.filter((i) => i.status === 'PENDING') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}. Here&apos;s what&apos;s happening in{' '}
          <span className="font-medium text-foreground">{activeOrg?.organization?.name ?? 'your organization'}</span>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members?.length ?? '—'}</div>
            <p className="text-xs text-muted-foreground">In this organization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.memberships?.length ?? '—'}</div>
            <p className="text-xs text-muted-foreground">You have access to</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent members */}
      {members && members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>Latest people to join your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {m.user?.firstName?.charAt(0)}{m.user?.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.user?.firstName} {m.user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(m.joinedAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
