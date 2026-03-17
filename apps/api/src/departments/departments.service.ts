import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, MemberRole } from '@prisma/client';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AddDepartmentMemberDto } from './dto/add-department-member.dto';

// Roles that can manage departments
const MANAGE_ROLES: MemberRole[] = [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MANAGER];

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(orgId: string, actorId: string, dto: CreateDepartmentDto) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);

    const existing = await this.prisma.department.findUnique({
      where: { name_organizationId: { name: dto.name, organizationId: orgId } },
    });
    if (existing) throw new ConflictException('A department with that name already exists');

    const dept = await this.prisma.department.create({
      data: { ...dto, organizationId: orgId, createdById: actorId },
    });

    await this.audit.log({ action: AuditAction.DEPARTMENT_CREATED, userId: actorId, organizationId: orgId, meta: { name: dto.name } });
    return dept;
  }

  findAll(orgId: string) {
    return this.prisma.department.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { members: true, teams: true } },
        members: {
          where: { isLead: true },
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, deptId: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id: deptId, organizationId: orgId },
      include: {
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
          orderBy: [{ isLead: 'desc' }, { joinedAt: 'asc' }],
        },
        teams: { select: { id: true, name: true, _count: { select: { members: true } } } },
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(orgId: string, deptId: string, actorId: string, dto: UpdateDepartmentDto) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);
    await this.findOne(orgId, deptId);

    const updated = await this.prisma.department.update({ where: { id: deptId }, data: dto });
    await this.audit.log({ action: AuditAction.DEPARTMENT_UPDATED, userId: actorId, organizationId: orgId, meta: { deptId } });
    return updated;
  }

  async remove(orgId: string, deptId: string, actorId: string) {
    await this.requireRole(actorId, orgId, [MemberRole.OWNER, MemberRole.ADMIN]);
    await this.findOne(orgId, deptId);

    await this.prisma.department.delete({ where: { id: deptId } });
    await this.audit.log({ action: AuditAction.DEPARTMENT_DELETED, userId: actorId, organizationId: orgId, meta: { deptId } });
    return { message: 'Department deleted' };
  }

  async addMember(orgId: string, deptId: string, actorId: string, dto: AddDepartmentMemberDto) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);
    await this.findOne(orgId, deptId);

    // Confirm the target is actually an org member
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: dto.userId, organizationId: orgId } },
    });
    if (!membership) throw new NotFoundException('User is not a member of this organization');

    const existing = await this.prisma.departmentMember.findUnique({
      where: { userId_departmentId: { userId: dto.userId, departmentId: deptId } },
    });
    if (existing) throw new ConflictException('User is already in this department');

    // If making a lead, demote existing leads first
    if (dto.isLead) {
      await this.prisma.departmentMember.updateMany({
        where: { departmentId: deptId, isLead: true },
        data: { isLead: false },
      });
    }

    const member = await this.prisma.departmentMember.create({
      data: { userId: dto.userId, departmentId: deptId, isLead: dto.isLead ?? false },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    await this.audit.log({ action: AuditAction.DEPARTMENT_MEMBER_ADDED, userId: actorId, organizationId: orgId, targetUserId: dto.userId, meta: { deptId } });
    return member;
  }

  async removeMember(orgId: string, deptId: string, actorId: string, userId: string) {
    await this.requireRole(actorId, orgId, MANAGE_ROLES);
    const record = await this.prisma.departmentMember.findUnique({
      where: { userId_departmentId: { userId, departmentId: deptId } },
    });
    if (!record) throw new NotFoundException('Member not found in department');

    await this.prisma.departmentMember.delete({
      where: { userId_departmentId: { userId, departmentId: deptId } },
    });
    await this.audit.log({ action: AuditAction.DEPARTMENT_MEMBER_REMOVED, userId: actorId, organizationId: orgId, targetUserId: userId, meta: { deptId } });
    return { message: 'Member removed from department' };
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
