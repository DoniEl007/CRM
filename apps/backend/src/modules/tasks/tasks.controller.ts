import { Body, Controller, ForbiddenException, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { GroupsService } from '../groups/groups.service.js';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { SubmitTaskDto } from './dto/submit-task.dto.js';
import { GradeSubmissionDto } from './dto/grade-submission.dto.js';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly groupsService: GroupsService,
    private readonly rbacService: RbacService,
  ) {}

  @Post()
  @RequirePermission('tasks.manage')
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.create(dto, user.userId, user.role);
  }

  @Get('mine')
  @RequirePermission('tasks.complete_own')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.findForStudent(user.userId);
  }

  @Get('results/mine')
  async getMyResults(@CurrentUser() user: AuthenticatedUser) {
    const hasViewOwn = await this.rbacService.isGranted(user.role, 'results.view_own');
    if (!hasViewOwn) throw new ForbiddenException('Missing permission: results.view_own');
    return this.tasksService.getMyResults(user.userId);
  }

  @Get('groups/:groupId')
  @RequirePermission('tasks.manage')
  async findForGroup(@Param('groupId') groupId: string, @CurrentUser() user: AuthenticatedUser) {
    const group = await this.groupsService.findByIdOrFail(groupId);
    if (user.role !== Role.FULL_ADMIN && group.teacherUserId !== user.userId) {
      throw new ForbiddenException('You can only view tasks for your own groups');
    }
    return this.tasksService.findForGroup(groupId);
  }

  @Get('groups/:groupId/rating')
  async getGroupRating(@Param('groupId') groupId: string, @CurrentUser() user: AuthenticatedUser) {
    const group = await this.groupsService.findByIdOrFail(groupId);
    const canReadScores = await this.rbacService.isGranted(user.role, 'results.read_scores');
    const canViewOwnGroup = await this.rbacService.isGranted(user.role, 'results.view_own_group');
    const ownsGroup = group.teacherUserId === user.userId;

    if (!canReadScores && !(canViewOwnGroup && ownsGroup)) {
      throw new ForbiddenException('You do not have access to this group\'s ratings');
    }
    return this.tasksService.getGroupRating(groupId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const task = await this.tasksService.findByIdOrFail(id);
    await this.tasksService.assertCanAccessTask(task, user.userId, user.role);
    return task;
  }

  @Get(':id/questions')
  async getQuestions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const task = await this.tasksService.findByIdOrFail(id);
    await this.tasksService.assertCanAccessTask(task, user.userId, user.role);
    const questions = await this.tasksService.getQuestions(id);

    // Students must never see the correct answer ahead of grading.
    if (user.role === Role.STUDENT) {
      return questions.map(({ id, sortOrder, questionText, options, hint }) => ({
        id,
        sortOrder,
        questionText,
        options,
        hint,
      }));
    }
    return questions;
  }

  @Post(':id/submit')
  @RequirePermission('tasks.complete_own')
  submit(@Param('id') id: string, @Body() dto: SubmitTaskDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.submit(id, dto, user.userId);
  }

  @Get(':id/submissions')
  async listSubmissions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const task = await this.tasksService.findByIdOrFail(id);
    if (user.role !== Role.FULL_ADMIN && task.teacherUserId !== user.userId) {
      throw new ForbiddenException('You can only view submissions for your own tasks');
    }
    return this.tasksService.listSubmissionsForTask(id);
  }

  @Patch('submissions/:submissionId/grade')
  @RequirePermission('tasks.manage')
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.gradeSubmission(submissionId, dto, user.userId, user.role);
  }
}
