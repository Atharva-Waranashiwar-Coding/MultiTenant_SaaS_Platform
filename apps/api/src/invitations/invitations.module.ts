import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController, InvitationPublicController } from './invitations.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [InvitationsService],
  controllers: [InvitationsController, InvitationPublicController],
})
export class InvitationsModule {}
