'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useTeam, useAddTeamMember, useRemoveTeamMember } from '@/hooks/use-teams';
import { useMembers } from '@/hooks/use-members';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { getInitials, getApiErrorMessage } from '@/lib/utils';
import { ArrowLeft, UserPlus, Trash2, Crown, Building2 } from 'lucide-react';

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  const { teamId } = params;
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();
  const { data: team, isLoading } = useTeam(activeOrganizationId ?? undefined, teamId);
  const { data: orgMembers } = useMembers(activeOrganizationId ?? undefined);
  const addMember = useAddTeamMember(activeOrganizationId!, teamId);
  const removeMember = useRemoveTeamMember(activeOrganizationId!, teamId);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [addError, setAddError] = useState('');

  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const canManage = ['OWNER', 'ADMIN', 'MANAGER'].includes(myRole ?? '');

  const teamMemberIds = new Set(team?.members?.map((m) => m.userId) ?? []);
  const addableMembers = orgMembers?.filter((m) => !teamMemberIds.has(m.userId)) ?? [];

  const handleAddMember = () => {
    setAddError('');
    addMember.mutate(
      { userId: selectedUser, isLead },
      {
        onSuccess: () => { setAddOpen(false); setSelectedUser(''); setIsLead(false); },
        onError: (e) => setAddError(getApiErrorMessage(e)),
      },
    );
  };

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!team) return <p className="text-muted-foreground">Team not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/teams" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Teams
        </Link>
        <PageHeader title={team.name} description={team.description ?? undefined}>
          {canManage && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="mr-1.5 h-4 w-4" />Add member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add member to {team.name}</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  {addError && <p className="text-sm text-destructive">{addError}</p>}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Member</label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger><SelectValue placeholder="Select a member…" /></SelectTrigger>
                      <SelectContent>
                        {addableMembers.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.user?.firstName} {m.user?.lastName} ({m.user?.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isLead" checked={isLead} onChange={(e) => setIsLead(e.target.checked)} />
                    <label htmlFor="isLead" className="text-sm">Set as team lead</label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMember} disabled={!selectedUser || addMember.isPending}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </PageHeader>
      </div>

      {/* Department badge */}
      {team.department && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <Link href={`/departments/${team.department.id}`} className="hover:underline">
            {team.department.name}
          </Link>
        </div>
      )}

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Members ({team.members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!team.members?.length ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="divide-y">
              {team.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {m.user ? getInitials(m.user.firstName, m.user.lastName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/people/${m.userId}`} className="text-sm font-medium hover:underline">
                      {m.user?.firstName} {m.user?.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                  </div>
                  {m.isLead && (
                    <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      <Crown className="h-3 w-3" />Lead
                    </span>
                  )}
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeMember.mutate(m.userId)}>
                      <Trash2 className="h-3.5 w-3.5" />
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
