import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { BulkMemberActionDto } from './dto/bulk-member-action.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { MemberRole } from '@prisma/client';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Members')
@ApiBearerAuth('access-token')
@UseGuards(TenantGuard)
@Controller('organizations/:orgId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // GET /api/v1/organizations/:orgId/members
  // Phase 2: added search, role, teamId, departmentId, isActive query params
  @Get()
  @ApiOperation({ summary: 'List members with search and filter' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: MemberRole })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Param('orgId') orgId: string,
    @Query('search') search?: string,
    @Query('role') role?: MemberRole,
    @Query('teamId') teamId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.membersService.findAll(orgId, {
      search,
      role,
      teamId,
      departmentId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  // GET /api/v1/organizations/:orgId/members/:userId
  @Get(':userId')
  @ApiOperation({ summary: 'Get member detail' })
  findOne(@Param('orgId') orgId: string, @Param('userId') userId: string) {
    return this.membersService.findOne(orgId, userId);
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Change a member role (OWNER/ADMIN)' })
  updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateRole(user.sub, orgId, targetUserId, dto);
  }

  // PATCH /api/v1/organizations/:orgId/members/:userId/status
  @Patch(':userId/status')
  @ApiOperation({ summary: 'Activate or deactivate a member (OWNER/ADMIN)' })
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.membersService.setActive(user.sub, orgId, targetUserId, isActive);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a member from the organization' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.membersService.remove(user.sub, orgId, targetUserId);
  }

  // POST /api/v1/organizations/:orgId/members/bulk
  @Post('bulk')
  @ApiOperation({ summary: 'Bulk activate, deactivate, or remove members (OWNER/ADMIN)' })
  bulkAction(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() dto: BulkMemberActionDto,
  ) {
    return this.membersService.bulkAction(user.sub, orgId, dto.userIds, dto.action);
  }
}
