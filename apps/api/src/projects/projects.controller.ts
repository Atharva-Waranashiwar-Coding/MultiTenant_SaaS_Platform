import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { BulkProjectActionDto } from './dto/bulk-project-action.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@UseGuards(TenantGuard)
@Controller('organizations/:orgId/projects')
export class ProjectsController {
  constructor(private readonly svc: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  create(@CurrentUser() u: JwtPayload, @Param('orgId') orgId: string, @Body() dto: CreateProjectDto) {
    return this.svc.create(orgId, u.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List projects with optional filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  findAll(
    @Param('orgId') orgId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.svc.findAll(orgId, {
      search,
      status,
      priority,
      includeArchived: includeArchived === 'true',
    });
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project detail with tasks and members' })
  findOne(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.svc.findOne(orgId, projectId);
  }

  @Patch(':projectId')
  @ApiOperation({ summary: 'Update project (owner, ADMIN, OWNER role)' })
  update(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.svc.update(orgId, projectId, u.sub, dto);
  }

  @Patch(':projectId/archive')
  @ApiOperation({ summary: 'Archive a project' })
  archive(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.svc.archive(orgId, projectId, u.sub, true);
  }

  @Patch(':projectId/unarchive')
  @ApiOperation({ summary: 'Unarchive a project' })
  unarchive(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.svc.archive(orgId, projectId, u.sub, false);
  }

  @Post(':projectId/members')
  @ApiOperation({ summary: 'Add a member to the project' })
  addMember(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body('userId') userId: string,
  ) {
    return this.svc.addMember(orgId, projectId, u.sub, userId);
  }

  @Delete(':projectId/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the project' })
  removeMember(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.svc.removeMember(orgId, projectId, u.sub, userId);
  }

  // POST /api/v1/organizations/:orgId/projects/bulk
  @Post('bulk')
  @ApiOperation({ summary: 'Bulk archive or unarchive projects (OWNER/ADMIN)' })
  bulkAction(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() dto: BulkProjectActionDto,
  ) {
    return this.svc.bulkArchive(orgId, u.sub, dto.projectIds, dto.action);
  }
}
