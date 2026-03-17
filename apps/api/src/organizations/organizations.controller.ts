import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // POST /api/v1/organizations
  @Post()
  @ApiOperation({ summary: 'Create a new organization (creator becomes OWNER)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.sub, dto);
  }

  // GET /api/v1/organizations
  @Get()
  @ApiOperation({ summary: 'List all organizations the current user belongs to' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.organizationsService.findAllForUser(user.sub);
  }

  // GET /api/v1/organizations/:orgId
  @Get(':orgId')
  @ApiOperation({ summary: 'Get organization details' })
  findOne(@Param('orgId') orgId: string) {
    return this.organizationsService.findById(orgId);
  }

  // PATCH /api/v1/organizations/:orgId
  @Patch(':orgId')
  @ApiOperation({ summary: 'Update organization (OWNER or ADMIN only)' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(orgId, user.sub, dto);
  }
}
