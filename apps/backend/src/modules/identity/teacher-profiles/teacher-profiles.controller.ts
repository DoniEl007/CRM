import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator.js';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator.js';
import { TeacherProfilesService } from './teacher-profiles.service.js';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto.js';

// Public teacher profiles are part of the public website (TT §3.1); editing
// them is website content, so it's gated the same as Course — 'website.edit'
// (Full Administrator only, per TT §4.1's "Public website (edit): Full").
@Controller('teacher-profiles')
export class TeacherProfilesController {
  constructor(private readonly teacherProfilesService: TeacherProfilesService) {}

  @Public()
  @Get('public')
  findPublished() {
    return this.teacherProfilesService.findPublished();
  }

  @Public()
  @Get('public/:userId')
  findPublishedOne(@Param('userId') userId: string) {
    return this.teacherProfilesService.findPublishedByUserIdOrFail(userId);
  }

  @Patch(':userId')
  @RequirePermission('website.edit')
  update(@Param('userId') userId: string, @Body() dto: UpdateTeacherProfileDto) {
    return this.teacherProfilesService.update(userId, dto);
  }
}
