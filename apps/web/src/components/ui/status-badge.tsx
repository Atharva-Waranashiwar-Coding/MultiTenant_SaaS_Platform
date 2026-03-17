import { cn } from '@/lib/utils';
import type { ProjectStatus, TaskStatus, Priority } from '@/types';

// ── Project status ────────────────────────────────────────
const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING:  'bg-blue-50  text-blue-700  border-blue-200',
  ACTIVE:    'bg-green-50 text-green-700 border-green-200',
  ON_HOLD:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  COMPLETED: 'bg-gray-50  text-gray-600  border-gray-200',
  CANCELLED: 'bg-red-50   text-red-700   border-red-200',
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning', ACTIVE: 'Active', ON_HOLD: 'On Hold', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

// ── Task status ───────────────────────────────────────────
const TASK_STATUS_STYLES: Record<TaskStatus, string> = {
  TODO:        'bg-gray-50   text-gray-600  border-gray-200',
  IN_PROGRESS: 'bg-blue-50   text-blue-700  border-blue-200',
  IN_REVIEW:   'bg-purple-50 text-purple-700 border-purple-200',
  DONE:        'bg-green-50  text-green-700 border-green-200',
  CANCELLED:   'bg-red-50    text-red-700   border-red-200',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done', CANCELLED: 'Cancelled',
};

// ── Priority ──────────────────────────────────────────────
const PRIORITY_STYLES: Record<Priority, string> = {
  LOW:    'bg-gray-50   text-gray-500  border-gray-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  HIGH:   'bg-orange-50 text-orange-700 border-orange-200',
  URGENT: 'bg-red-50    text-red-700   border-red-200',
};

const BASE = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold';

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={cn(BASE, PROJECT_STATUS_STYLES[status])}>{PROJECT_STATUS_LABELS[status]}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn(BASE, TASK_STATUS_STYLES[status])}>{TASK_STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={cn(BASE, PRIORITY_STYLES[priority])}>{priority}</span>;
}
