import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, MemberRole } from '@prisma/client';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';

const MANAGE_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MANAGER];

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(orgId: string, actorId: string, dto: CreateTeamDto) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);

    const existing = await this.prisma.team.findUnique({
      where: { name_organizationId: { name: dto.name, organizationId: orgId } },
    });
    if (existing) throw new ConflictException('A team with that name already exists');

    const team = await this.prisma.team.create({
      data: { ...dto, organizationId: orgId, createdById: actorId },
    });

    await this.audit.log({ action: AuditAction.TEAM_CREATED, userId: actorId, organizationId: orgId, meta: { name: dto.name } });
    return team;
  }

  findAll(orgId: string) {
    return this.prisma.team.findMany({
      where: { organizationId: orgId },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { members: true } },
        members: {
          where: { isLead: true },
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId: orgId },
      include: {
        department: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
          orderBy: [{ isLead: 'desc' }, { joinedAt: 'asc' }],
        },
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(orgId: string, teamId: string, actorId: string, dto: UpdateTeamDto) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);
    await this.findOne(orgId, teamId);
    const updated = await this.prisma.team.update({ where: { id: teamId }, data: dto });
    await this.audit.log({ action: AuditAction.TEAM_UPDATED, userId: actorId, organizationId: orgId, meta: { teamId } });
    return updated;
  }

  async remove(orgId: string, teamId: string, actorId: string) {
    await this.requireRole(actorId, orgId, [MemberRole.OWNER, MemberRole.ADMIN]);
    await this.findOne(orgId, teamId);
    await this.prisma.team.delete({ where: { id: teamId } });
    await this.audit.log({ action: AuditAction.TEAM_DELETED, userId: actorId, organizationId: orgId, meta: { teamId } });
    return { message: 'Team deleted' };
  }

  async addMember(orgId: string, teamId: string, actorId: string, dto: AddTeamMemberDto) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);
    await this.findOne(orgId, teamId);

    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: dto.userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('User is not a member of this organization');

    const existing = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: dto.userId, teamId } },
    });
    if (existing) throw new ConflictException('User is already in this team');

    if (dto.isLead) {
      await this.prisma.teamMember.updateMany({
        where: { teamId, isLead: true },
        data: { isLead: false },
      });
    }

    const member = await this.prisma.teamMember.create({
      data: { userId: dto.userId, teamId, isLead: dto.isLead ?? false },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    await this.audit.log({ action: AuditAction.TEAM_MEMBER_ADDED, userId: actorId, organizationId: orgId, targetUserId: dto.userId, meta: { teamId } });
    return member;
  }

  async removeMember(orgId: string, teamId: string, actorId: string, userId: string) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);
    const record = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!record) throw new NotFoundException('Member not found in team');
    await this.prisma.teamMember.delete({ where: { userId_teamId: { userId, teamId } } });
    await this.audit.log({ action: AuditAction.TEAM_MEMBER_REMOVED, userId: actorId, organizationId: orgId, targetUserId: userId, meta: { teamId } });
    return { message: 'Member removed from team' };
  }

  private async requireRole(userId: string, orgId: string, roles: MemberRole[]) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!m) throw new ForbiddenException('Not a member');
    if (!roles.includes(m.role)) throw new ForbiddenException('Insufficient permissions');
    return m;
  }
}
