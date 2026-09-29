import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { GroupsService } from './groups.service.js';
import { ScheduleSlotsService } from './schedule-slots.service.js';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto/group.dto.js';
import { CreateScheduleSlotDto } from './dto/schedule-slot.dto.js';
import type { Group, GroupCategory } from './entities/group.entity.js';

// TT §4.1: only Full Administrator manages groups & scheduling; Teacher has
// "View own" (their assigned group(s) only); Administrative Staff, CEO, and
// Student have no access to this module at all.
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly scheduleSlotsService: ScheduleSlotsService,
    private readonly rbacService: RbacService,
  ) {}

  @Get()
  @RequirePermission('groups.manage')
  findAll(@Query('category') category?: GroupCategory) {
    return this.groupsService.findAll(category);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    await this.assertCanViewOwn(user);
    return this.groupsService.findForTeacher(user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const group = await this.groupsService.findByIdOrFail(id);
    await this.assertCanView(user, group);
    return group;
  }

  @Post()
  @RequirePermission('groups.manage')
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('groups.manage')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const group = await this.groupsService.findByIdOrFail(id);
    await this.assertCanView(user, group);
    return this.groupsService.getMembers(id);
  }

  @Post(':id/members')
  @RequirePermission('groups.manage')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.groupsService.addMember(id, dto.studentUserId);
  }

  @Delete(':id/members/:studentUserId')
  @RequirePermission('groups.manage')
  removeMember(@Param('id') id: string, @Param('studentUserId') studentUserId: string) {
    return this.groupsService.removeMember(id, studentUserId);
  }

  @Get(':id/schedule')
  async getSchedule(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const group = await this.groupsService.findByIdOrFail(id);
    await this.assertCanView(user, group);
    return this.scheduleSlotsService.listForGroup(id);
  }

  @Post(':id/schedule')
  @RequirePermission('groups.manage')
  addScheduleSlot(@Param('id') id: string, @Body() dto: CreateScheduleSlotDto) {
    return this.scheduleSlotsService.create(id, dto);
  }

  @Delete(':id/schedule/:slotId')
  @RequirePermission('groups.manage')
  removeScheduleSlot(@Param('id') id: string, @Param('slotId') slotId: string) {
    return this.scheduleSlotsService.remove(id, slotId);
  }

  private async assertCanViewOwn(user: AuthenticatedUser): Promise<void> {
    const hasViewOwn = await this.rbacService.isGranted(user.role, 'groups.view_own');
    if (!hasViewOwn) throw new ForbiddenException('Missing permission: groups.view_own');
  }

  private async assertCanView(user: AuthenticatedUser, group: Group): Promise<void> {
    const hasManage = await this.rbacService.isGranted(user.role, 'groups.manage');
    if (hasManage) return;

    const hasViewOwn = await this.rbacService.isGranted(user.role, 'groups.view_own');
    if (hasViewOwn && group.teacherUserId === user.userId) return;

    throw new ForbiddenException('You do not have access to this group');
  }
}
