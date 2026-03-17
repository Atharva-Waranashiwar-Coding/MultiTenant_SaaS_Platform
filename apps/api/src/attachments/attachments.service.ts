import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async upload(
    orgId: string,
    actorId: string,
    file: Express.Multer.File,
    projectId?: string,
    taskId?: string,
  ) {
    // Verify the actor is a member of the org
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: actorId, organizationId: orgId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this organization');

    if (!projectId && !taskId) {
      throw new BadRequestException('Must specify projectId or taskId');
    }

    // Verify project belongs to this org
    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, organizationId: orgId },
      });
      if (!project) throw new NotFoundException('Project not found');
    }

    // Verify task belongs to a project in this org
    if (taskId) {
      const task = await this.prisma.task.findFirst({
        where: {
          id: taskId,
          project: { organizationId: orgId },
          isDeleted: false,
        },
      });
      if (!task) throw new NotFoundException('Task not found');
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        organizationId: orgId,
        projectId: projectId ?? null,
        taskId: taskId ?? null,
        uploadedById: actorId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath: file.path, // disk path from multer
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.audit.log({
      action: AuditAction.ATTACHMENT_UPLOADED,
      userId: actorId,
      organizationId: orgId,
      meta: { attachmentId: attachment.id, fileName: file.originalname, projectId, taskId },
    });

    return attachment;
  }

  async listByProject(orgId: string, projectId: string) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.attachment.findMany({
      where: { projectId, organizationId: orgId },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByTask(orgId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { organizationId: orgId }, isDeleted: false },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.attachment.findMany({
      where: { taskId, organizationId: orgId },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async download(orgId: string, attachmentId: string, actorId: string) {
    // Verify membership
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: actorId, organizationId: orgId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this organization');

    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, organizationId: orgId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    const absolutePath = path.resolve(attachment.storagePath);
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('File not found on storage');
    }

    return { attachment, absolutePath };
  }

  async remove(orgId: string, attachmentId: string, actorId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: actorId, organizationId: orgId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this organization');

    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, organizationId: orgId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    // Only uploader or OWNER/ADMIN can delete
    const canDelete =
      attachment.uploadedById === actorId ||
      membership.role === 'OWNER' ||
      membership.role === 'ADMIN';

    if (!canDelete) throw new ForbiddenException('Only the uploader or an admin can delete attachments');

    // Delete file from disk
    const absolutePath = path.resolve(attachment.storagePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    await this.audit.log({
      action: AuditAction.ATTACHMENT_DELETED,
      userId: actorId,
      organizationId: orgId,
      meta: { attachmentId, fileName: attachment.fileName },
    });

    return { message: 'Attachment deleted' };
  }
}
