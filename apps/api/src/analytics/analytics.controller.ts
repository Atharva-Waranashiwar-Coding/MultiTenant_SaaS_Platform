import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MemberRole } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('organizations/:orgId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get organization analytics summary' })
  @Roles(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MANAGER)
  getSummary(@Param('orgId') orgId: string) {
    return this.analyticsService.getSummary(orgId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get 6-month trends (members, projects, tasks)' })
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  getTrends(@Param('orgId') orgId: string) {
    return this.analyticsService.getTrends(orgId);
  }
}
