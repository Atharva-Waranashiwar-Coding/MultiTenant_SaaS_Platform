import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Teams')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/teams')
export class TeamsController {
  constructor(private readonly svc: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a team' })
  create(@CurrentUser() u: JwtPayload, @Param('orgId') orgId: string, @Body() dto: CreateTeamDto) {
    return this.svc.create(orgId, u.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all teams in an organization' })
  findAll(@Param('orgId') orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Get(':teamId')
  @ApiOperation({ summary: 'Get team detail with members' })
  findOne(@Param('orgId') orgId: string, @Param('teamId') teamId: string) {
    return this.svc.findOne(orgId, teamId);
  }

  @Patch(':teamId')
  @ApiOperation({ summary: 'Update team' })
  update(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.svc.update(orgId, teamId, u.sub, dto);
  }

  @Delete(':teamId')
  @ApiOperation({ summary: 'Delete a team (OWNER/ADMIN)' })
  remove(@CurrentUser() u: JwtPayload, @Param('orgId') orgId: string, @Param('teamId') teamId: string) {
    return this.svc.remove(orgId, teamId, u.sub);
  }

  @Post(':teamId/members')
  @ApiOperation({ summary: 'Add a member to the team' })
  addMember(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.svc.addMember(orgId, teamId, u.sub, dto);
  }

  @Delete(':teamId/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the team' })
  removeMember(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ) {
    return this.svc.removeMember(orgId, teamId, u.sub, userId);
  }
}
