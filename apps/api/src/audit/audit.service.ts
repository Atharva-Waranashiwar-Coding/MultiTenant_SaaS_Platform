import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

interface LogParams {
  action: AuditAction;
  userId?: string;
  organizationId?: string;
  targetUserId?: string;
  meta?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

// Thin service for writing audit log entries.
// Called from other services — never directly from controllers.
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogParams): Promise<void> {
    await this.prisma.auditLog.create({ data: params });
  }

  // Get audit logs for an organization (for the UI)
  findByOrganization(organizationId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}
