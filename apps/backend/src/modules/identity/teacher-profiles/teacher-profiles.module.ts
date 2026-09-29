import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherProfile } from '../entities/teacher-profile.entity.js';
import { TeacherProfilesService } from './teacher-profiles.service.js';
import { TeacherProfilesController } from './teacher-profiles.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherProfile])],
  providers: [TeacherProfilesService],
  controllers: [TeacherProfilesController],
  exports: [TeacherProfilesService],
})
export class TeacherProfilesModule {}
