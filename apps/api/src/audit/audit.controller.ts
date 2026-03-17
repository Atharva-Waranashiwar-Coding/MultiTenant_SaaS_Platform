import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // GET /api/v1/organizations/:orgId/audit
  @Get()
  @ApiOperation({ summary: 'Get audit logs for an organization' })
  getAuditLogs(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByOrganization(orgId, limit);
  }
}
