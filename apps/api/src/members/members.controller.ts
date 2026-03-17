import { Controller, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Members')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // GET /api/v1/organizations/:orgId/members
  @Get()
  @ApiOperation({ summary: 'List all members of an organization' })
  findAll(@Param('orgId') orgId: string) {
    return this.membersService.findAll(orgId);
  }

  // PATCH /api/v1/organizations/:orgId/members/:userId/role
  @Patch(':userId/role')
  @ApiOperation({ summary: 'Change a member role (OWNER/ADMIN only)' })
  updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateRole(user.sub, orgId, targetUserId, dto);
  }

  // DELETE /api/v1/organizations/:orgId/members/:userId
  @Delete(':userId')
  @ApiOperation({ summary: 'Remove a member from the organization (OWNER/ADMIN only)' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.membersService.remove(user.sub, orgId, targetUserId);
  }
}
