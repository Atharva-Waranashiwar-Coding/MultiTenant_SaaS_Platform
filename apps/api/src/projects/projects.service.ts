import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, MemberRole, Prisma } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const userSummary = {
  id: true, firstName: true, lastName: true, email: true, avatarUrl: true,
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(orgId: string, actorId: string, dto: CreateProjectDto) {
    await this.requireOrgMember(actorId, orgId);

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        tags: dto.tags ?? [],
        organizationId: orgId,
        ownerId: dto.ownerId ?? actorId,
        createdById: actorId,
      },
    });

    // Auto-add creator as a project member
    await this.prisma.projectMember.create({ data: { userId: actorId, projectId: project.id } });

    await this.audit.log({ action: AuditAction.PROJECT_CREATED, userId: actorId, organizationId: orgId, meta: { name: dto.name } });
    return project;
  }

  findAll(
    orgId: string,
    query?: { search?: string; status?: string; priority?: string; includeArchived?: boolean },
  ) {
    const where: Prisma.ProjectWhereInput = { organizationId: orgId };

    if (!query?.includeArchived) where.isArchived = false;
    if (query?.status) where.status = query.status as any;
    if (query?.priority) where.priority = query.priority as any;
    if (query?.search) where.name = { contains: query.search, mode: 'insensitive' };

    return this.prisma.project.findMany({
      where,
      include: {
        owner: { select: userSummary },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(orgId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
      include: {
        owner: { select: userSummary },
        createdBy: { select: userSummary },
        members: { include: { user: { select: userSummary } } },
        tasks: {
          where: { isDeleted: false },
          include: { assignee: { select: userSummary } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(orgId: string, projectId: string, actorId: string, dto: UpdateProjectDto) {
    const project = await this.findOne(orgId, projectId);
    await this.requireProjectAccess(actorId, orgId, project.ownerId);

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    await this.audit.log({ action: AuditAction.PROJECT_UPDATED, userId: actorId, organizationId: orgId, meta: { projectId } });
    return updated;
  }

  async archive(orgId: string, projectId: string, actorId: string, archive: boolean) {
    const project = await this.findOne(orgId, projectId);
    await this.requireProjectAccess(actorId, orgId, project.ownerId);

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { isArchived: archive, archivedAt: archive ? new Date() : null },
    });

    await this.audit.log({
      action: archive ? AuditAction.PROJECT_ARCHIVED : AuditAction.PROJECT_UNARCHIVED,
      userId: actorId,
      organizationId: orgId,
      meta: { projectId },
    });
    return updated;
  }

  async addMember(orgId: string, projectId: string, actorId: string, userId: string) {
    const project = await this.findOne(orgId, projectId);
    await this.requireProjectAccess(actorId, orgId, project.ownerId);

    const inOrg = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!inOrg) throw new NotFoundException('User is not a member of this organization');

    const existing = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
    if (existing) throw new ConflictException('User is already a project member');

    const member = await this.prisma.projectMember.create({
      data: { userId, projectId },
      include: { user: { select: userSummary } },
    });

    await this.audit.log({ action: AuditAction.PROJECT_MEMBER_ADDED, userId: actorId, organizationId: orgId, targetUserId: userId, meta: { projectId } });
    return member;
  }

  async removeMember(orgId: string, projectId: string, actorId: string, userId: string) {
    const project = await this.findOne(orgId, projectId);
    await this.requireProjectAccess(actorId, orgId, project.ownerId);

    await this.prisma.projectMember.deleteMany({ where: { userId, projectId } });
    await this.audit.log({ action: AuditAction.PROJECT_MEMBER_REMOVED, userId: actorId, organizationId: orgId, targetUserId: userId, meta: { projectId } });
    return { message: 'Member removed from project' };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private async requireOrgMember(userId: string, orgId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!m) throw new ForbiddenException('Not a member of this organization');
    return m;
  }

  // Owner, project owner, OWNER, and ADMIN can edit a project
  private async requireProjectAccess(userId: string, orgId: string, projectOwnerId: string) {
    const m = await this.requireOrgMember(userId, orgId);
    const isAdmin = m.role === MemberRole.OWNER || m.role === MemberRole.ADMIN;
    const isProjectOwner = userId === projectOwnerId;
    if (!isAdmin && !isProjectOwner) throw new ForbiddenException('Only project owner or org admin can edit this project');
  }
}
