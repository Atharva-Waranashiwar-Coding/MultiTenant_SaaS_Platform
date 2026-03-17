import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { AuditModule } from '../audit/audit.module';

// NOTE: Requires multer to be installed:
//   npm install multer @types/multer   (in apps/api)
// The uploads directory must exist at the API root:
//   mkdir -p apps/api/uploads
// For production, swap diskStorage for multer-s3 or equivalent.

@Module({
  imports: [AuditModule],
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
})
export class AttachmentsModule {}
