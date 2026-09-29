import { Body, Controller, ForbiddenException, Get, Param, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { AttendanceService } from './attendance.service.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';

// TT §4.1: Attendance is Full Administrator ("Full") and Administrative Staff
// ("Record") only — Teacher has no access to this module, Student sees only
// their own ("Own").
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly rbacService: RbacService,
  ) {}

  @Get('groups/:groupId/roster')
  @RequirePermission('attendance.record')
  getRoster(@Param('groupId') groupId: string, @Query('date') date: string) {
    return this.attendanceService.getRoster(groupId, date);
  }

  @Post('groups/:groupId')
  @RequirePermission('attendance.record')
  mark(
    @Param('groupId') groupId: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.mark(groupId, dto, user.userId);
  }

  @Get('me')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    const hasViewOwn = await this.rbacService.isGranted(user.role, 'attendance.view_own');
    if (!hasViewOwn) throw new ForbiddenException('Missing permission: attendance.view_own');
    return this.attendanceService.findForStudent(user.userId);
  }

  @Get('students/:studentUserId')
  @RequirePermission('attendance.record')
  findForStudent(@Param('studentUserId') studentUserId: string) {
    return this.attendanceService.findForStudent(studentUserId);
  }
}
