'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useMembers, useUpdateMemberRole, useRemoveMember } from '@/hooks/use-members';
import { useInvitations, useCreateInvitation, useRevokeInvitation } from '@/hooks/use-invitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getRoleBadgeColor, getInviteStatusColor, getInitials, formatDate, getApiErrorMessage } from '@/lib/utils';
import { UserPlus, Trash2 } from 'lucide-react';
import type { MemberRole } from '@/types';

const ROLES: MemberRole[] = ['ADMIN', 'MANAGER', 'MEMBER'];

export default function MembersPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: user } = useMe();
  const { data: members, isLoading } = useMembers(activeOrganizationId ?? undefined);
  const { data: invitations } = useInvitations(activeOrganizationId ?? undefined);
  const updateRole = useUpdateMemberRole(activeOrganizationId!);
  const removeMember = useRemoveMember(activeOrganizationId!);
  const createInvitation = useCreateInvitation(activeOrganizationId!);
  const revokeInvitation = useRevokeInvitation(activeOrganizationId!);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('MEMBER');
  const [inviteError, setInviteError] = useState('');

  const activeRole = user?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const canManage = activeRole === 'OWNER' || activeRole === 'ADMIN';

  const handleInvite = () => {
    setInviteError('');
    createInvitation.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => { setInviteOpen(false); setInviteEmail(''); setInviteRole('MEMBER'); },
        onError: (err) => setInviteError(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">Manage who has access to your organization</p>
        </div>
        {canManage && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a new member</DialogTitle>
                <DialogDescription>
                  They'll receive an email with a link to join your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}
                <div className="space-y-1.5">
                  <Label>Email address</Label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={!inviteEmail || createInvitation.isPending}>
                  {createInvitation.isPending ? 'Sending...' : 'Send invite'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Team members ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : members?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="divide-y">
              {members?.map((m) => (
                <div key={m.id} className="flex items-center gap-4 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {m.user ? getInitials(m.user.firstName, m.user.lastName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {m.user?.firstName} {m.user?.lastName}
                      {m.userId === user?.id && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{m.user?.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(m.joinedAt)}</span>

                  {canManage && m.userId !== user?.id && m.role !== 'OWNER' ? (
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        updateRole.mutate({ userId: m.userId, role: v as MemberRole })
                      }
                    >
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeColor(m.role)}`}>
                      {m.role}
                    </span>
                  )}

                  {canManage && m.userId !== user?.id && m.role !== 'OWNER' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMember.mutate(m.userId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
            <CardDescription>Pending and past invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Invited by {inv.invitedBy?.firstName} · Role: {inv.role}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getInviteStatusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                  {canManage && inv.status === 'PENDING' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => revokeInvitation.mutate(inv.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
