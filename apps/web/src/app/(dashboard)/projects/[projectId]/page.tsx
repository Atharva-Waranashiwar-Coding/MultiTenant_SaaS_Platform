'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useMe } from '@/hooks/use-auth';
import { useProject, useArchiveProject, useAddProjectMember, useRemoveProjectMember } from '@/hooks/use-projects';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks';
import { useMembers } from '@/hooks/use-members';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectStatusBadge, TaskStatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { getInitials, getApiErrorMessage } from '@/lib/utils';
import type { TaskStatus, Priority } from '@/types';
import { ArrowLeft, Archive, ArchiveRestore, UserPlus, Trash2, Plus, CheckSquare, Calendar } from 'lucide-react';

const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
const PRIORITY_OPTIONS: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done', CANCELLED: 'Cancelled',
};

export default function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { activeOrganizationId } = useAuthStore();
  const { data: me } = useMe();

  const { data: project, isLoading } = useProject(activeOrganizationId ?? undefined, projectId);
  const { data: tasks } = useTasks(activeOrganizationId ?? undefined, projectId);
  const { data: orgMembers } = useMembers(activeOrganizationId ?? undefined);

  const archiveProject = useArchiveProject(activeOrganizationId!);
  const addProjectMember = useAddProjectMember(activeOrganizationId!, projectId);
  const removeProjectMember = useRemoveProjectMember(activeOrganizationId!, projectId);
  const createTask = useCreateTask(activeOrganizationId!, projectId);
  const deleteTask = useDeleteTask(activeOrganizationId!, projectId);

  const myRole = me?.memberships?.find((m) => m.organizationId === activeOrganizationId)?.role;
  const isOwner = project?.ownerId === me?.id;
  const canManage = ['OWNER', 'ADMIN'].includes(myRole ?? '') || isOwner;
  const canEdit = canManage || myRole === 'MANAGER';

  // Task filter
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | ''>('');

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Create task dialog
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskError, setTaskError] = useState('');

  const projectMemberIds = new Set(project?.members?.map((m) => m.userId) ?? []);
  const addableMembers = orgMembers?.filter((m) => !projectMemberIds.has(m.userId)) ?? [];

  const filteredTasks = tasks?.filter((t) => !taskStatusFilter || t.status === taskStatusFilter) ?? [];

  const handleAddMember = () => {
    addProjectMember.mutate(selectedMemberId, {
      onSuccess: () => { setAddMemberOpen(false); setSelectedMemberId(''); },
    });
  };

  const handleCreateTask = () => {
    setTaskError('');
    createTask.mutate(
      {
        title: taskTitle,
        priority: taskPriority,
        assigneeId: taskAssignee || undefined,
        dueDate: taskDueDate || undefined,
      },
      {
        onSuccess: () => { setAddTaskOpen(false); setTaskTitle(''); setTaskPriority('MEDIUM'); setTaskAssignee(''); setTaskDueDate(''); },
        onError: (e) => setTaskError(getApiErrorMessage(e)),
      },
    );
  };

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (!project) return <p className="text-muted-foreground">Project not found.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/projects" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
        <PageHeader title={project.name} description={project.description ?? undefined}>
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => archiveProject.mutate({ projectId: project.id, archive: !project.isArchived })}
              >
                {project.isArchived ? (
                  <><ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />Unarchive</>
                ) : (
                  <><Archive className="mr-1.5 h-3.5 w-3.5" />Archive</>
                )}
              </Button>
            )}
          </div>
        </PageHeader>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {project.owner && (
          <span>Owner: <span className="text-foreground font-medium">{project.owner.firstName} {project.owner.lastName}</span></span>
        )}
        {project.dueDate && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Due {new Date(project.dueDate).toLocaleDateString()}
          </span>
        )}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Tasks ({filteredTasks.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={taskStatusFilter} onValueChange={(v) => setTaskStatusFilter(v as TaskStatus | '')}>
              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            {canEdit && (
              <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="mr-1 h-3.5 w-3.5" />Add task</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
                  <div className="space-y-3 py-2">
                    {taskError && <p className="text-sm text-destructive">{taskError}</p>}
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as Priority)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Due date <span className="text-muted-foreground">(optional)</span></Label>
                        <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                      </div>
                    </div>
                    {project.members && project.members.length > 0 && (
                      <div className="space-y-1.5">
                        <Label>Assignee <span className="text-muted-foreground">(optional)</span></Label>
                        <Select value={taskAssignee} onValueChange={setTaskAssignee}>
                          <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {project.members.map((m) => (
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
                    <Button variant="outline" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTask} disabled={!taskTitle || createTask.isPending}>
                      {createTask.isPending ? 'Creating…' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!filteredTasks.length ? (
            <EmptyState icon={CheckSquare} title="No tasks" description="Add tasks to track work for this project." />
          ) : (
            <div className="divide-y">
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projectMembers={project.members ?? []}
                  canEdit={canEdit}
                  onDelete={() => deleteTask.mutate(task.id)}
                  orgId={activeOrganizationId!}
                  projectId={projectId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Members ({project.members?.length ?? 0})</CardTitle>
          {canManage && (
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs"><UserPlus className="mr-1 h-3.5 w-3.5" />Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add member to project</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMember} disabled={!selectedMemberId || addProjectMember.isPending}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {!project.members?.length ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="divide-y">
              {project.members.map((m) => (
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
                  {canManage && m.userId !== project.ownerId && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeProjectMember.mutate(m.userId)}>
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

// ── Task row sub-component ────────────────────────────────────────────────────
import type { Task, ProjectMember } from '@/types';

function TaskRow({
  task,
  projectMembers,
  canEdit,
  onDelete,
  orgId,
  projectId,
}: {
  task: Task;
  projectMembers: ProjectMember[];
  canEdit: boolean;
  onDelete: () => void;
  orgId: string;
  projectId: string;
}) {
  const updateTask = useUpdateTask(orgId, projectId, task.id);

  return (
    <div className="flex items-center gap-3 py-2.5 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{task.title}</p>
        {task.dueDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {task.assignee && (
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback className="text-[10px]">
            {getInitials(task.assignee.firstName, task.assignee.lastName)}
          </AvatarFallback>
        </Avatar>
      )}

      <PriorityBadge priority={task.priority} />

      {canEdit ? (
        <Select
          value={task.status}
          onValueChange={(v) => updateTask.mutate({ status: v as TaskStatus })}
        >
          <SelectTrigger className="h-6 w-32 text-xs border-none shadow-none px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <TaskStatusBadge status={task.status} />
      )}

      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
