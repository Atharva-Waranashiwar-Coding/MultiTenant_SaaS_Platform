import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { UpsertOverrideDto } from './dto/upsert-override.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { MemberRole } from '@prisma/client';

@ApiTags('Permissions')
@ApiBearerAuth('access-token')
@UseGuards(TenantGuard, RolesGuard)
@Controller('organizations/:orgId/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // GET /organizations/:orgId/permissions/mine
  // Returns the full permission map for the current user (used by frontend)
  @Get('mine')
  @ApiOperation({ summary: 'Get all permissions for the current user in this org' })
  getMyPermissions(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
  ) {
    return this.permissionsService.getAll(user.sub, orgId);
  }

  // GET /organizations/:orgId/permissions/overrides
  @Get('overrides')
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  @ApiOperation({ summary: 'List all role permission overrides for this org' })
  listOverrides(@Param('orgId') orgId: string) {
    return this.permissionsService.listOverrides(orgId);
  }

  // POST /organizations/:orgId/permissions/overrides
  @Post('overrides')
  @Roles(MemberRole.OWNER)
  @ApiOperation({ summary: 'Create or update a role permission override (OWNER only)' })
  upsertOverride(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() dto: UpsertOverrideDto,
  ) {
    return this.permissionsService.upsertOverride(user.sub, orgId, dto.role, dto.permission, dto.granted);
  }

  // DELETE /organizations/:orgId/permissions/overrides/:id
  @Delete('overrides/:id')
  @Roles(MemberRole.OWNER)
  @ApiOperation({ summary: 'Delete a permission override — reverts to default (OWNER only)' })
  deleteOverride(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.permissionsService.deleteOverride(user.sub, orgId, id);
  }
}
