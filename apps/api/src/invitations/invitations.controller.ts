import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Invitations')
@Controller('organizations/:orgId/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // POST /api/v1/organizations/:orgId/invitations
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Invite a user to the organization by email' })
  create(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(user.sub, orgId, dto);
  }

  // GET /api/v1/organizations/:orgId/invitations
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all invitations for an organization' })
  findAll(@Param('orgId') orgId: string) {
    return this.invitationsService.findAll(orgId);
  }

  // DELETE /api/v1/organizations/:orgId/invitations/:invitationId
  @Delete(':invitationId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  revoke(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.revoke(user.sub, orgId, invitationId);
  }
}

// Separate controller for public/user-facing invitation routes
@ApiTags('Invitations')
@Controller('invitations')
export class InvitationPublicController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // GET /api/v1/invitations/accept?token=...
  // Public — used to render invitation details on the accept page (before login)
  @Public()
  @Get('preview')
  @ApiOperation({ summary: 'Preview invitation details by token (public)' })
  preview(@Query('token') token: string) {
    return this.invitationsService.findByToken(token);
  }

  // POST /api/v1/invitations/accept
  // Authenticated — user must be logged in to accept
  @Post('accept')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Accept an invitation (authenticated user)' })
  accept(
    @CurrentUser() user: JwtPayload,
    @Body('token') token: string,
  ) {
    return this.invitationsService.accept(token, user.sub);
  }
}
