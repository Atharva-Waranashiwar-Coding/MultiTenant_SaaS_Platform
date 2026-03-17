import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditAction, MemberRole, NotificationType, Prisma } from '@prisma/client';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notifications: NotificationsService,
  ) {}

  // ── List members with search + filter (Phase 2 extension) ────
  findAll(
    organizationId: string,
    query?: {
      search?: string;
      role?: MemberRole;
      teamId?: string;
      departmentId?: string;
      isActive?: boolean;
    },
  ) {
    const where: Prisma.MembershipWhereInput = { organizationId };

    if (query?.role) where.role = query.role;
    if (query?.isActive !== undefined) where.isActive = query.isActive;

    if (query?.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    // Filter by team or department — membership in those
    if (query?.teamId) {
      where.user = {
        ...((where.user as Prisma.UserWhereInput) ?? {}),
        teamMembers: { some: { teamId: query.teamId } },
      };
    }
    if (query?.departmentId) {
      where.user = {
        ...((where.user as Prisma.UserWhereInput) ?? {}),
        departmentMembers: { some: { departmentId: query.departmentId } },
      };
    }

    return this.prisma.membership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            teamMembers: { select: { team: { select: { id: true, name: true } }, isLead: true } },
            departmentMembers: { select: { department: { select: { id: true, name: true } }, isLead: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ── Get single member detail ──────────────────────────────────
  async findOne(organizationId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            isEmailVerified: true,
            createdAt: true,
            teamMembers: {
              include: { team: { select: { id: true, name: true } } },
            },
            departmentMembers: {
              include: { department: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
    if (!membership) throw new NotFoundException('Member not found');
    return membership;
  }

  // ── Change role ───────────────────────────────────────────────
  async updateRole(actorId: string, organizationId: string, targetUserId: string, dto: UpdateMemberRoleDto) {
    const actorMembership = await this.requireMembership(actorId, organizationId);
    const targetMembership = await this.requireMembership(targetUserId, organizationId);

    if (actorMembership.role !== MemberRole.OWNER && actorMembership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only OWNER or ADMIN can change roles');
    }
    if (targetMembership.role === MemberRole.OWNER && actorMembership.role !== MemberRole.OWNER) {
      throw new ForbiddenException("Only another OWNER can change an OWNER's role");
    }
    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role directly. Use ownership transfer.');
    }

    const updated = await this.prisma.membership.update({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
      data: { role: dto.role },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    await this.auditService.log({ action: AuditAction.MEMBER_ROLE_CHANGED, userId: actorId, organizationId, targetUserId, meta: { from: targetMembership.role, to: dto.role } });

    // Notify the affected member about their role change
    await this.notifications.notify({
      userId: targetUserId,
      orgId: organizationId,
      type: NotificationType.MEMBER_ROLE_CHANGED,
      title: 'Your role was updated',
      body: `Your role changed from ${targetMembership.role} to ${dto.role}.`,
      meta: { from: targetMembership.role, to: dto.role },
    });

    return updated;
  }

  // ── Activate / Deactivate (Phase 2) ──────────────────────────
  async setActive(actorId: string, organizationId: string, targetUserId: string, isActive: boolean) {
    const actorMembership = await this.requireMembership(actorId, organizationId);
    const targetMembership = await this.requireMembership(targetUserId, organizationId);

    if (actorMembership.role !== MemberRole.OWNER && actorMembership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only OWNER or ADMIN can activate/deactivate members');
    }
    if (targetMembership.role === MemberRole.OWNER) {
      throw new ForbiddenException('Cannot deactivate an OWNER');
    }

    const updated = await this.prisma.membership.update({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
      data: { isActive },
    });

    await this.auditService.log({
      action: isActive ? AuditAction.MEMBER_ACTIVATED : AuditAction.MEMBER_DEACTIVATED,
      userId: actorId,
      organizationId,
      targetUserId,
    });

    return updated;
  }

  // ── Remove ────────────────────────────────────────────────────
  async remove(actorId: string, organizationId: string, targetUserId: string) {
    const actorMembership = await this.requireMembership(actorId, organizationId);
    const targetMembership = await this.requireMembership(targetUserId, organizationId);

    if (actorId === targetUserId) throw new BadRequestException('Cannot remove yourself.');
    if (targetMembership.role === MemberRole.OWNER) throw new ForbiddenException('Cannot remove an organization OWNER');
    if (actorMembership.role === MemberRole.MEMBER || actorMembership.role === MemberRole.MANAGER) {
      throw new ForbiddenException('Insufficient permissions to remove members');
    }

    await this.prisma.membership.delete({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    });

    await this.auditService.log({ action: AuditAction.MEMBER_REMOVED, userId: actorId, organizationId, targetUserId });
    return { message: 'Member removed successfully' };
  }

  private async requireMembership(userId: string, organizationId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!m) throw new NotFoundException('Membership not found');
    return m;
  }
}
