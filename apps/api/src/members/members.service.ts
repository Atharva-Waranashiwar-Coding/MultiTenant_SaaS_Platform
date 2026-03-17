import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, MemberRole } from '@prisma/client';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // List all members of an organization
  findAll(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // Change a member's role
  async updateRole(
    actorId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const actorMembership = await this.requireMembership(actorId, organizationId);
    const targetMembership = await this.requireMembership(targetUserId, organizationId);

    // Only OWNER or ADMIN can change roles
    if (actorMembership.role !== MemberRole.OWNER && actorMembership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Only OWNER or ADMIN can change roles');
    }

    // Cannot demote/change an OWNER unless you are also an OWNER
    if (targetMembership.role === MemberRole.OWNER && actorMembership.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only another OWNER can change an OWNER\'s role');
    }

    // Cannot promote someone to OWNER (handled by ownership transfer in Phase 2)
    if (dto.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role directly. Use ownership transfer.');
    }

    const updated = await this.prisma.membership.update({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.auditService.log({
      action: AuditAction.MEMBER_ROLE_CHANGED,
      userId: actorId,
      organizationId,
      targetUserId,
      meta: { from: targetMembership.role, to: dto.role },
    });

    return updated;
  }

  // Remove a member from the organization
  async remove(actorId: string, organizationId: string, targetUserId: string) {
    const actorMembership = await this.requireMembership(actorId, organizationId);
    const targetMembership = await this.requireMembership(targetUserId, organizationId);

    // Cannot remove yourself (use a leave endpoint in Phase 2)
    if (actorId === targetUserId) {
      throw new BadRequestException('Cannot remove yourself. Use leave organization.');
    }

    // Cannot remove an OWNER
    if (targetMembership.role === MemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove an organization OWNER');
    }

    // ADMIN can remove MEMBER/MANAGER; OWNER can remove anyone
    if (actorMembership.role === MemberRole.MEMBER || actorMembership.role === MemberRole.MANAGER) {
      throw new ForbiddenException('Insufficient permissions to remove members');
    }

    await this.prisma.membership.delete({
      where: { userId_organizationId: { userId: targetUserId, organizationId } },
    });

    await this.auditService.log({
      action: AuditAction.MEMBER_REMOVED,
      userId: actorId,
      organizationId,
      targetUserId,
    });

    return { message: 'Member removed successfully' };
  }

  private async requireMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) throw new NotFoundException('Membership not found');
    return membership;
  }
}
