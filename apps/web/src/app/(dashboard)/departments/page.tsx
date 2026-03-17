'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useDepartments, useCreateDepartment, useDeleteDepartment } from '@/hooks/use-departments';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { getApiErrorMessage } from '@/lib/utils';
import { Building2, Plus, Trash2, ChevronRight, Users } from 'lucide-react';

export default function DepartmentsPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();
  const { data: departments, isLoading } = useDepartments(activeOrganizationId ?? undefined);
  const createDept = useCreateDepartment(activeOrganizationId!);
  const deleteDept = useDeleteDepartment(activeOrganizationId!);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const canManage = ['OWNER', 'ADMIN', 'MANAGER'].includes(myRole ?? '');

  const handleCreate = () => {
    setError('');
    createDept.mutate(
      { name, description: description || undefined },
      {
        onSuccess: () => { setOpen(false); setName(''); setDescription(''); },
        onError: (e) => setError(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Departments" description="Logical groupings of people in your organization">
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />New department</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create department</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Engineering" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                  <Input placeholder="What does this department do?" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!name || createDept.isPending}>
                  {createDept.isPending ? 'Creating…' : 'Create'}
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
      ) : !departments?.length ? (
        <EmptyState icon={Building2} title="No departments yet" description="Create your first department to group team members." actionLabel={canManage ? 'Create department' : undefined} onAction={canManage ? () => setOpen(true) : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id} className="group relative hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <Link href={`/departments/${dept.id}`} className="block">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">{dept.name}</p>
                  {dept.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{dept.description}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{dept._count?.members ?? 0} members</span>
                    <span>{dept._count?.teams ?? 0} teams</span>
                  </div>
                </Link>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-8 h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteDept.mutate(dept.id)}
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
