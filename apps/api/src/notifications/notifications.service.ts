import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateNotificationDto {
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a notification. Called from other services — never by controllers directly.
   * Fire-and-forget: we don't want notification failures to break main operations.
   */
  async notify(dto: CreateNotificationDto): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: dto.userId,
          organizationId: dto.orgId,
          type: dto.type,
          title: dto.title,
          body: dto.body,
          meta: (dto.meta ?? {}) as object,
        },
      });
    } catch {
      // Notification failure must never crash the calling request
      console.error('[Notifications] Failed to create notification', dto);
    }
  }

  /**
   * List notifications for the current user in an org.
   * Most-recent-first, with optional unread-only filter.
   */
  findAll(
    userId: string,
    orgId: string,
    query: { unreadOnly?: boolean; page?: number; limit?: number },
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      organizationId: orgId,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    return this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]).then(([data, total]) => ({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }));
  }

  /** Count unread notifications — used for the bell badge. */
  async countUnread(userId: string, orgId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, organizationId: orgId, isRead: false },
    });
  }

  /** Mark a single notification as read. */
  async markRead(userId: string, orgId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId, organizationId: orgId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** Mark all unread notifications as read. */
  async markAllRead(userId: string, orgId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, organizationId: orgId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }
}
