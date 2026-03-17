import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(TenantGuard)
@Controller('organizations/:orgId/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /organizations/:orgId/notifications
  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(user.sub, orgId, {
      unreadOnly: unreadOnly === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // GET /organizations/:orgId/notifications/unread-count
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count (for bell badge)' })
  countUnread(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.notificationsService.countUnread(user.sub, orgId).then((count) => ({ count }));
  }

  // PATCH /organizations/:orgId/notifications/read-all
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.notificationsService.markAllRead(user.sub, orgId);
  }

  // PATCH /organizations/:orgId/notifications/:id/read
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(user.sub, orgId, id);
  }
}
