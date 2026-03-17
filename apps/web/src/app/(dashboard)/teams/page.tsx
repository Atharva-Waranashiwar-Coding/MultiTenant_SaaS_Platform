'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useTeams, useCreateTeam, useDeleteTeam } from '@/hooks/use-teams';
import { useDepartments } from '@/hooks/use-departments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { getApiErrorMessage } from '@/lib/utils';
import { UsersRound, Plus, Trash2, ChevronRight } from 'lucide-react';

export default function TeamsPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();
  const { data: teams, isLoading } = useTeams(activeOrganizationId ?? undefined);
  const { data: departments } = useDepartments(activeOrganizationId ?? undefined);
  const createTeam = useCreateTeam(activeOrganizationId!);
  const deleteTeam = useDeleteTeam(activeOrganizationId!);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState('');

  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const canManage = ['OWNER', 'ADMIN', 'MANAGER'].includes(myRole ?? '');

  const handleCreate = () => {
    setError('');
    createTeam.mutate(
      { name, description: description || undefined, departmentId: departmentId || undefined },
      {
        onSuccess: () => { setOpen(false); setName(''); setDescription(''); setDepartmentId(''); },
        onError: (e) => setError(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Teams" description="Cross-functional groups within your organization">
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />New team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create team</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Frontend Squad" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                {departments && departments.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Department <span className="text-muted-foreground">(optional)</span></Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No department</SelectItem>
                        {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!name || createTeam.isPending}>
                  {createTeam.isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : !teams?.length ? (
        <EmptyState icon={UsersRound} title="No teams yet" description="Create teams to organise members across projects." actionLabel={canManage ? 'Create team' : undefined} onAction={canManage ? () => setOpen(true) : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="group relative hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Link href={`/teams/${team.id}`} className="block">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                      <UsersRound className="h-4 w-4" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">{team.name}</p>
                  {team.department && (
                    <p className="text-xs text-muted-foreground mt-0.5">{team.department.name}</p>
                  )}
                  {team.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{team.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{team._count?.members ?? 0} members</p>
                </Link>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-8 h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTeam.mutate(team.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
