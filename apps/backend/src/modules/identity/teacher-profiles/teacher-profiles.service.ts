import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherProfile } from '../entities/teacher-profile.entity.js';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto.js';

@Injectable()
export class TeacherProfilesService {
  constructor(@InjectRepository(TeacherProfile) private readonly profilesRepo: Repository<TeacherProfile>) {}

  findPublished(): Promise<TeacherProfile[]> {
    return this.profilesRepo.find({
      where: { isPublished: true },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findPublishedByUserIdOrFail(userId: string): Promise<TeacherProfile> {
    const profile = await this.profilesRepo.findOne({
      where: { userId, isPublished: true },
      relations: { user: true },
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return profile;
  }

  async update(userId: string, dto: UpdateTeacherProfileDto): Promise<TeacherProfile> {
    let profile = await this.profilesRepo.findOne({ where: { userId } });
    if (!profile) {
      // Should already exist (created alongside the User when role=TEACHER),
      // but guard against the edge case rather than 404 on a valid teacher.
      profile = this.profilesRepo.create({ userId });
    }
    Object.assign(profile, dto);
    return this.profilesRepo.save(profile);
  }
}
