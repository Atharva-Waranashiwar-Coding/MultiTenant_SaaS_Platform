import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AuditAction, InvitationStatus, MemberRole, NotificationType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const INVITATION_EXPIRES_IN_DAYS = 7;

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notifications: NotificationsService,
  ) {}

  // Invite a user by email to join an organization
  async create(actorId: string, organizationId: string, dto: CreateInvitationDto) {
    // Only OWNER or ADMIN can send invites
    await this.requireRole(actorId, organizationId, [MemberRole.OWNER, MemberRole.ADMIN]);

    // Check if they're already a member
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      const alreadyMember = await this.prisma.membership.findUnique({
        where: { userId_organizationId: { userId: existingUser.id, organizationId } },
      });
      if (alreadyMember) throw new ConflictException('User is already a member of this organization');
    }

    // Check for existing pending invitation
    const existingInvite = await this.prisma.invitation.findFirst({
      where: { email: dto.email, organizationId, status: InvitationStatus.PENDING },
    });
    if (existingInvite) throw new ConflictException('A pending invitation already exists for this email');

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRES_IN_DAYS);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        organizationId,
        invitedById: actorId,
        role: dto.role ?? MemberRole.MEMBER,
        token,
        expiresAt,
      },
      include: {
        organization: { select: { name: true } },
        invitedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await this.auditService.log({
      action: AuditAction.MEMBER_INVITED,
      userId: actorId,
      organizationId,
      meta: { invitedEmail: dto.email, role: dto.role },
    });

    // Phase 2: send invitation email here with the accept URL
    console.log(`[DEV] Invite token for ${dto.email}: ${token}`);
    console.log(`[DEV] Accept URL: ${process.env.FRONTEND_URL}/invite/accept?token=${token}`);

    return invitation;
  }

  // List invitations for an organization
  findAll(organizationId: string) {
    return this.prisma.invitation.findMany({
      where: { organizationId },
      include: {
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Accept an invitation via token
  async accept(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { token } });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`Invitation is ${invitation.status.toLowerCase()}`);
    }
    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Verify the accepting user's email matches the invitation email
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    // Create membership + mark invitation accepted — transactionally
    const membership = await this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
        include: { organization: true },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
      });

      return membership;
    });

    await this.auditService.log({
      action: AuditAction.MEMBER_INVITATION_ACCEPTED,
      userId,
      organizationId: invitation.organizationId,
    });

    // Notify the inviter that their invitation was accepted
    const acceptingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    if (acceptingUser) {
      await this.notifications.notify({
        userId: invitation.invitedById,
        orgId: invitation.organizationId,
        type: NotificationType.INVITE_ACCEPTED,
        title: 'Invitation accepted',
        body: `${acceptingUser.firstName} ${acceptingUser.lastName} accepted your invitation and joined the organization.`,
        meta: { acceptedByUserId: userId },
      });
    }

    return membership;
  }

  // Revoke a pending invitation
  async revoke(actorId: string, organizationId: string, invitationId: string) {
    await this.requireRole(actorId, organizationId, [MemberRole.OWNER, MemberRole.ADMIN]);

    const invitation = await this.prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invitation || invitation.organizationId !== organizationId) {
      throw new NotFoundException('Invitation not found');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be revoked');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.REVOKED },
    });

    await this.auditService.log({
      action: AuditAction.MEMBER_INVITATION_REVOKED,
      userId: actorId,
      organizationId,
      meta: { invitedEmail: invitation.email },
    });

    return { message: 'Invitation revoked' };
  }

  // Get invitation details by token (public — for the accept page)
  async findByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    return invitation;
  }

  private async requireRole(userId: string, orgId: string, roles: MemberRole[]) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!membership) throw new ForbiddenException('Not a member');
    if (!roles.includes(membership.role)) throw new ForbiddenException('Insufficient permissions');
    return membership;
  }
}
