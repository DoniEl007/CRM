import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto.js';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get('public')
  findPublished() {
    return this.coursesService.findPublished();
  }

  @Public()
  @Get('public/:id')
  findPublishedOne(@Param('id') id: string) {
    return this.coursesService.findPublishedByIdOrFail(id);
  }

  @Get()
  @RequirePermission('website.edit')
  findAllForStaff() {
    return this.coursesService.findAllForStaff();
  }

  @Get(':id')
  @RequirePermission('website.edit')
  findOne(@Param('id') id: string) {
    return this.coursesService.findByIdOrFail(id);
  }

  @Post()
  @RequirePermission('website.edit')
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('website.edit')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }
}
