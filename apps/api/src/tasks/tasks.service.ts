import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditAction, NotificationType, TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { BulkTaskAction } from './dto/bulk-task-action.dto';

const userSummary = { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } as const;

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────
  private async getProjectOrFail(projectId: string, orgId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async requireProjectMember(userId: string, projectId: string, orgId: string) {
    // Any org member can create/view tasks; only org members access org data
    const m = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!m) throw new ForbiddenException('Not a member of this organization');
    return m;
  }

  // ── CRUD ──────────────────────────────────────────────────────

  async create(orgId: string, projectId: string, actorId: string, dto: CreateTaskDto) {
    await this.getProjectOrFail(projectId, orgId);
    await this.requireProjectMember(actorId, projectId, orgId);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        tags: dto.tags ?? [],
        projectId,
        assigneeId: dto.assigneeId,
        createdById: actorId,
      },
      include: { assignee: { select: userSummary }, createdBy: { select: userSummary } },
    });

    await this.audit.log({ action: AuditAction.TASK_CREATED, userId: actorId, organizationId: orgId, meta: { taskId: task.id, title: dto.title, projectId } });
    return task;
  }

  findAll(orgId: string, projectId: string, query?: { status?: TaskStatus; assigneeId?: string; search?: string }) {
    const where: any = { projectId, isDeleted: false };
    if (query?.status) where.status = query.status;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;
    if (query?.search) where.title = { contains: query.search, mode: 'insensitive' };

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: userSummary },
        createdBy: { select: userSummary },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, projectId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId, isDeleted: false },
      include: {
        assignee: { select: userSummary },
        createdBy: { select: userSummary },
        comments: {
          include: { user: { select: userSummary } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(orgId: string, projectId: string, taskId: string, actorId: string, dto: UpdateTaskDto) {
    await this.getProjectOrFail(projectId, orgId);
    const task = await this.findOne(orgId, projectId, taskId);
    await this.requireProjectMember(actorId, projectId, orgId);

    const previousStatus = task.status;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { assignee: { select: userSummary } },
    });

    // Log status change separately for cleaner audit trail
    if (dto.status && dto.status !== previousStatus) {
      await this.audit.log({ action: AuditAction.TASK_STATUS_CHANGED, userId: actorId, organizationId: orgId, meta: { taskId, from: previousStatus, to: dto.status, projectId } });
    } else {
      await this.audit.log({ action: AuditAction.TASK_UPDATED, userId: actorId, organizationId: orgId, meta: { taskId, projectId } });
    }

    if (dto.assigneeId && dto.assigneeId !== task.assigneeId) {
      await this.audit.log({ action: AuditAction.TASK_ASSIGNED, userId: actorId, organizationId: orgId, targetUserId: dto.assigneeId, meta: { taskId, projectId } });
      // Notify the new assignee (skip if they assigned it to themselves)
      if (dto.assigneeId !== actorId) {
        await this.notifications.notify({
          userId: dto.assigneeId,
          orgId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task assigned to you',
          body: `You have been assigned to "${updated.title ?? task.title}".`,
          meta: { taskId, projectId },
        });
      }
    }

    return updated;
  }

  async remove(orgId: string, projectId: string, taskId: string, actorId: string) {
    await this.getProjectOrFail(projectId, orgId);
    await this.findOne(orgId, projectId, taskId);
    await this.requireProjectMember(actorId, projectId, orgId);

    // Soft delete
    await this.prisma.task.update({
      where: { id: taskId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await this.audit.log({ action: AuditAction.TASK_DELETED, userId: actorId, organizationId: orgId, meta: { taskId, projectId } });
    return { message: 'Task deleted' };
  }

  // ── Comments ──────────────────────────────────────────────────

  async addComment(orgId: string, projectId: string, taskId: string, actorId: string, dto: CreateCommentDto) {
    await this.getProjectOrFail(projectId, orgId);
    await this.findOne(orgId, projectId, taskId);
    await this.requireProjectMember(actorId, projectId, orgId);

    const comment = await this.prisma.taskComment.create({
      data: { content: dto.content, taskId, userId: actorId },
      include: { user: { select: userSummary } },
    });

    await this.audit.log({ action: AuditAction.TASK_COMMENT_ADDED, userId: actorId, organizationId: orgId, meta: { taskId, projectId } });
    return comment;
  }

  async deleteComment(orgId: string, taskId: string, commentId: string, actorId: string) {
    const comment = await this.prisma.taskComment.findFirst({
      where: { id: commentId, taskId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== actorId) throw new ForbiddenException('You can only delete your own comments');
    await this.prisma.taskComment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted' };
  }

  // ── Bulk Actions (Phase 5) ────────────────────────────────────
  async bulkAction(
    orgId: string,
    projectId: string,
    actorId: string,
    taskIds: string[],
    action: BulkTaskAction,
    status?: TaskStatus,
  ) {
    await this.getProjectOrFail(projectId, orgId);
    await this.requireProjectMember(actorId, projectId, orgId);

    // Verify all tasks belong to this project
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds }, projectId },
    });
    const validIds = tasks.map((t) => t.id);
    if (validIds.length === 0) return { affected: 0 };

    if (action === BulkTaskAction.DELETE) {
      await this.prisma.task.updateMany({
        where: { id: { in: validIds }, projectId },
        data: { isDeleted: true, deletedAt: new Date() },
      });
      await this.audit.log({
        action: AuditAction.TASK_BULK_DELETED,
        userId: actorId,
        organizationId: orgId,
        meta: { count: validIds.length, projectId },
      });
    } else if (action === BulkTaskAction.RESTORE) {
      await this.prisma.task.updateMany({
        where: { id: { in: validIds }, projectId },
        data: { isDeleted: false, deletedAt: null },
      });
      await this.audit.log({
        action: AuditAction.TASK_BULK_RESTORED,
        userId: actorId,
        organizationId: orgId,
        meta: { count: validIds.length, projectId },
      });
    } else if (action === BulkTaskAction.SET_STATUS) {
      if (!status) throw new BadRequestException('status is required for set_status action');
      await this.prisma.task.updateMany({
        where: { id: { in: validIds }, projectId, isDeleted: false },
        data: { status },
      });
      await this.audit.log({
        action: AuditAction.TASK_BULK_DELETED, // reuse for now; extend enum if needed
        userId: actorId,
        organizationId: orgId,
        meta: { count: validIds.length, projectId, status },
      });
    }

    return { affected: validIds.length };
  }
}
