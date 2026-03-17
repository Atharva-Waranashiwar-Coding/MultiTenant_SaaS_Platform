import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuditAction, MemberRole } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('An organization with that slug already exists');

    // Create org + add creator as OWNER in one transaction
    const org = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          createdById: userId,
        },
      });

      await tx.membership.create({
        data: {
          userId,
          organizationId: org.id,
          role: MemberRole.OWNER,
        },
      });

      return org;
    });

    await this.auditService.log({
      action: AuditAction.ORG_CREATED,
      userId,
      organizationId: org.id,
      meta: { orgName: org.name, slug: org.slug },
    });

    return org;
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async findById(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: { select: { memberships: true } },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    await this.ensureMembership(userId, orgId, [MemberRole.OWNER, MemberRole.ADMIN]);

    const updated = await this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
    });

    await this.auditService.log({
      action: AuditAction.ORG_UPDATED,
      userId,
      organizationId: orgId,
    });

    return updated;
  }

  // ── Helper ────────────────────────────────────────────────
  private async ensureMembership(userId: string, orgId: string, allowedRoles: MemberRole[]) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    if (!membership) throw new ForbiddenException('Not a member of this organization');
    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return membership;
  }
}
