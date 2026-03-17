'use client';

import { use, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useDepartment, useAddDepartmentMember, useRemoveDepartmentMember } from '@/hooks/use-departments';
import { useMembers } from '@/hooks/use-members';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { getInitials, getApiErrorMessage } from '@/lib/utils';
import { ArrowLeft, UserPlus, Trash2, Crown } from 'lucide-react';

export default function DepartmentDetailPage({ params }: { params: Promise<{ deptId: string }> }) {
  const { deptId } = use(params);
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();
  const { data: dept, isLoading } = useDepartment(activeOrganizationId ?? undefined, deptId);
  const { data: orgMembers } = useMembers(activeOrganizationId ?? undefined);
  const addMember = useAddDepartmentMember(activeOrganizationId!, deptId);
  const removeMember = useRemoveDepartmentMember(activeOrganizationId!, deptId);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [addError, setAddError] = useState('');

  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const canManage = ['OWNER', 'ADMIN', 'MANAGER'].includes(myRole ?? '');

  const deptMemberIds = new Set(dept?.members?.map((m) => m.userId) ?? []);
  const addableMembers = orgMembers?.filter((m) => !deptMemberIds.has(m.userId)) ?? [];

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

  if (!dept) return <p className="text-muted-foreground">Department not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/departments" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Departments
        </Link>
        <PageHeader title={dept.name} description={dept.description ?? undefined}>
          {canManage && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="mr-1.5 h-4 w-4" />Add member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add member to {dept.name}</DialogTitle></DialogHeader>
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
                    <label htmlFor="isLead" className="text-sm">Set as department lead</label>
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

      {/* Teams in this department */}
      {dept.teams && dept.teams.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Teams ({dept.teams.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dept.teams.map((t) => (
                <Link key={t.id} href={`/teams/${t.id}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors">
                  {t.name} · {t._count.members}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Members ({dept.members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!dept.members?.length ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="divide-y">
              {dept.members.map((m) => (
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
