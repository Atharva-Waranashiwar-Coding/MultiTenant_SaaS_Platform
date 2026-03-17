import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TenantGuard } from '../common/guards/tenant.guard';
import { v4 as uuidv4 } from 'uuid';

// ── Multer disk storage config ───────────────────────────────────
// Files are written to ./uploads/<orgId>/ on the API server.
// For production, replace diskStorage with a cloud storage engine
// (e.g., multer-s3 for AWS S3, @google-cloud/storage, etc.)
const storage = diskStorage({
  destination: (_req, _file, cb) => cb(null, './uploads'),
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

@ApiTags('Attachments')
@ApiBearerAuth('access-token')
@UseGuards(TenantGuard)
@Controller('organizations/:orgId/attachments')
export class AttachmentsController {
  constructor(private readonly svc: AttachmentsService) {}

  // POST /organizations/:orgId/attachments
  // Multipart upload. Pass projectId or taskId as query param.
  @Post()
  @ApiOperation({ summary: 'Upload an attachment (max 10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage }))
  upload(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })], // 10 MB
      }),
    )
    file: Express.Multer.File,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
  ) {
    return this.svc.upload(orgId, u.sub, file, projectId, taskId);
  }

  // GET /organizations/:orgId/attachments?projectId=...
  @Get()
  @ApiOperation({ summary: 'List attachments for a project or task' })
  list(
    @Param('orgId') orgId: string,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
  ) {
    if (projectId) return this.svc.listByProject(orgId, projectId);
    if (taskId) return this.svc.listByTask(orgId, taskId);
    return [];
  }

  // GET /organizations/:orgId/attachments/:attachmentId/download
  @Get(':attachmentId/download')
  @ApiOperation({ summary: 'Download an attachment (auth required)' })
  async download(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const { attachment, absolutePath } = await this.svc.download(orgId, attachmentId, u.sub);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(absolutePath);
  }

  // DELETE /organizations/:orgId/attachments/:attachmentId
  @Delete(':attachmentId')
  @ApiOperation({ summary: 'Delete an attachment' })
  remove(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.svc.remove(orgId, attachmentId, u.sub);
  }
}
