import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { AddDepartmentMemberDto } from './dto/add-department-member.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Departments')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/departments')
export class DepartmentsController {
  constructor(private readonly svc: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a department (OWNER/ADMIN/MANAGER)' })
  create(@CurrentUser() u: JwtPayload, @Param('orgId') orgId: string, @Body() dto: CreateDepartmentDto) {
    return this.svc.create(orgId, u.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all departments in an organization' })
  findAll(@Param('orgId') orgId: string) {
    return this.svc.findAll(orgId);
  }

  @Get(':deptId')
  @ApiOperation({ summary: 'Get department detail with members and teams' })
  findOne(@Param('orgId') orgId: string, @Param('deptId') deptId: string) {
    return this.svc.findOne(orgId, deptId);
  }

  @Patch(':deptId')
  @ApiOperation({ summary: 'Update department name/description' })
  update(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('deptId') deptId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.svc.update(orgId, deptId, u.sub, dto);
  }

  @Delete(':deptId')
  @ApiOperation({ summary: 'Delete department (OWNER/ADMIN)' })
  remove(@CurrentUser() u: JwtPayload, @Param('orgId') orgId: string, @Param('deptId') deptId: string) {
    return this.svc.remove(orgId, deptId, u.sub);
  }

  @Post(':deptId/members')
  @ApiOperation({ summary: 'Add a member to the department' })
  addMember(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('deptId') deptId: string,
    @Body() dto: AddDepartmentMemberDto,
  ) {
    return this.svc.addMember(orgId, deptId, u.sub, dto);
  }

  @Delete(':deptId/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the department' })
  removeMember(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('deptId') deptId: string,
    @Param('userId') userId: string,
  ) {
    return this.svc.removeMember(orgId, deptId, u.sub, userId);
  }
}
