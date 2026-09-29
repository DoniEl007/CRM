import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity.js';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto.js';

@Injectable()
export class CoursesService {
  constructor(@InjectRepository(Course) private readonly coursesRepo: Repository<Course>) {}

  create(dto: CreateCourseDto): Promise<Course> {
    return this.coursesRepo.save(this.coursesRepo.create(dto));
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findByIdOrFail(id);
    Object.assign(course, dto);
    return this.coursesRepo.save(course);
  }

  // Staff view: every course regardless of publish state.
  findAllForStaff(): Promise<Course[]> {
    return this.coursesRepo.find({ order: { createdAt: 'DESC' } });
  }

  // Public view: published courses only (TT §3.1 course catalog).
  findPublished(): Promise<Course[]> {
    return this.coursesRepo.find({ where: { isPublished: true }, order: { createdAt: 'DESC' } });
  }

  async findPublishedByIdOrFail(id: string): Promise<Course> {
    const course = await this.coursesRepo.findOne({ where: { id, isPublished: true } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findByIdOrFail(id: string): Promise<Course> {
    const course = await this.coursesRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }
}
