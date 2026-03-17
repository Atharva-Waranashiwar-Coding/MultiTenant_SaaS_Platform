'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useProjects, useCreateProject, useArchiveProject } from '@/hooks/use-projects';
import { useMembers } from '@/hooks/use-members';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectStatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { getApiErrorMessage } from '@/lib/utils';
import type { ProjectStatus, Priority } from '@/types';
import { FolderKanban, Plus, Archive, ChevronRight, Calendar } from 'lucide-react';

const STATUS_OPTIONS: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function ProjectsPage() {
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();
  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const canManage = ['OWNER', 'ADMIN', 'MANAGER'].includes(myRole ?? '');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data: projects, isLoading } = useProjects(activeOrganizationId ?? undefined, {
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
    includeArchived,
  });
  const { data: orgMembers } = useMembers(activeOrganizationId ?? undefined);
  const createProject = useCreateProject(activeOrganizationId!);
  const archiveProject = useArchiveProject(activeOrganizationId!);

  // Create dialog state
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    setError('');
    createProject.mutate(
      {
        name,
        description: description || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        ownerId: ownerId || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName(''); setDescription(''); setStatus('PLANNING');
          setPriority('MEDIUM'); setDueDate(''); setOwnerId('');
        },
        onError: (e) => setError(getApiErrorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Projects" description="Track work across your organization">
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />New project</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="Q3 Platform Revamp" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Due date <span className="text-muted-foreground">(optional)</span></Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                {orgMembers && orgMembers.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Owner <span className="text-muted-foreground">(optional)</span></Label>
                    <Select value={ownerId} onValueChange={setOwnerId}>
                      <SelectTrigger><SelectValue placeholder="Select owner…" /></SelectTrigger>
                      <SelectContent>
                        {orgMembers.map((m) => (
                          <SelectItem key={m.userId} value={m.userId}>
                            {m.user?.firstName} {m.user?.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!name || createProject.isPending}>
                  {createProject.isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All priorities</SelectItem>
            {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Show archived
        </label>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : !projects?.length ? (
        <EmptyState icon={FolderKanban} title="No projects" description="Create a project to start tracking work." actionLabel={canManage ? 'Create project' : undefined} onAction={canManage ? () => setOpen(true) : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className={`group relative hover:border-primary/50 transition-colors ${project.isArchived ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <Link href={`/projects/${project.id}`} className="block">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                      <FolderKanban className="h-4 w-4" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                  )}
                  <div className="mt-2 flex items-center flex-wrap gap-1.5">
                    <ProjectStatusBadge status={project.status} />
                    <PriorityBadge priority={project.priority} />
                  </div>
                  {project.dueDate && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.dueDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{project._count?.members ?? 0} members · {project._count?.tasks ?? 0} tasks</p>
                </Link>
                {canManage && !project.isArchived && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-8 h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground"
                    title="Archive"
                    onClick={() => archiveProject.mutate({ projectId: project.id, archive: true })}
                  >
                    <Archive className="h-3.5 w-3.5" />
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
