import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TaskStatus } from '@prisma/client';
import { TenantGuard } from '../common/guards/tenant.guard';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@UseGuards(TenantGuard)
@Controller('organizations/:orgId/projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task in a project' })
  create(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.svc.create(orgId, projectId, u.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks in a project' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Query('status') status?: TaskStatus,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.findAll(orgId, projectId, { status, assigneeId, search });
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task detail with comments' })
  findOne(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.svc.findOne(orgId, projectId, taskId);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.svc.update(orgId, projectId, taskId, u.sub, dto);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Soft-delete a task' })
  remove(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.svc.remove(orgId, projectId, taskId, u.sub);
  }

  @Post(':taskId/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  addComment(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.svc.addComment(orgId, projectId, taskId, u.sub, dto);
  }

  @Delete(':taskId/comments/:commentId')
  @ApiOperation({ summary: 'Delete own comment' })
  deleteComment(
    @CurrentUser() u: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.svc.deleteComment(orgId, taskId, commentId, u.sub);
  }
}
