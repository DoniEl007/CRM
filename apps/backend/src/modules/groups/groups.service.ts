import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { UsersService } from '../identity/users/users.service.js';
import { Group, GroupCategory } from './entities/group.entity.js';
import { GroupMembership } from './entities/group-membership.entity.js';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto.js';

// Fixed by TT §1.4 ("maximum 10 students"); not a per-group configurable
// setting, so it's a constant rather than a column.
export const MAX_GROUP_SIZE = 10;

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMembership) private readonly membershipsRepo: Repository<GroupMembership>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateGroupDto): Promise<Group> {
    await this.assertIsTeacher(dto.teacherUserId);
    return this.groupsRepo.save(
      this.groupsRepo.create({ name: dto.name, category: dto.category, teacherUserId: dto.teacherUserId }),
    );
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.findByIdOrFail(id);
    if (dto.teacherUserId) await this.assertIsTeacher(dto.teacherUserId);
    Object.assign(group, dto);
    return this.groupsRepo.save(group);
  }

  findAll(category?: GroupCategory): Promise<Group[]> {
    return this.groupsRepo.find({
      where: category ? { category } : {},
      relations: { teacher: true },
      order: { createdAt: 'DESC' },
    });
  }

  findForTeacher(teacherUserId: string): Promise<Group[]> {
    return this.groupsRepo.find({ where: { teacherUserId }, order: { createdAt: 'DESC' } });
  }

  async findByIdOrFail(id: string): Promise<Group> {
    const group = await this.groupsRepo.findOne({ where: { id }, relations: { teacher: true } });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async getMembers(groupId: string): Promise<GroupMembership[]> {
    await this.findByIdOrFail(groupId);
    return this.membershipsRepo.find({ where: { groupId }, relations: { student: true } });
  }

  async isMember(groupId: string, studentUserId: string): Promise<boolean> {
    const count = await this.membershipsRepo.count({ where: { groupId, studentUserId } });
    return count > 0;
  }

  // Every group a student belongs to, across subjects (many-to-many —
  // confirmed decision). Used by the tasks module's "my tasks" view.
  async findGroupIdsForStudent(studentUserId: string): Promise<string[]> {
    const memberships = await this.membershipsRepo.find({ where: { studentUserId } });
    return memberships.map((m) => m.groupId);
  }

  async addMember(groupId: string, studentUserId: string): Promise<GroupMembership> {
    await this.findByIdOrFail(groupId);
    await this.assertIsStudent(studentUserId);

    const existing = await this.membershipsRepo.findOne({ where: { groupId, studentUserId } });
    if (existing) throw new ConflictException('Student is already a member of this group');

    const currentSize = await this.membershipsRepo.count({ where: { groupId } });
    if (currentSize >= MAX_GROUP_SIZE) {
      throw new BadRequestException(`Group already has the maximum of ${MAX_GROUP_SIZE} students`);
    }

    return this.membershipsRepo.save(this.membershipsRepo.create({ groupId, studentUserId }));
  }

  async removeMember(groupId: string, studentUserId: string): Promise<void> {
    const result = await this.membershipsRepo.delete({ groupId, studentUserId });
    if (result.affected === 0) throw new NotFoundException('Membership not found');
  }

  private async assertIsTeacher(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || user.role !== Role.TEACHER) {
      throw new BadRequestException('teacherUserId must reference a user with role TEACHER');
    }
  }

  private async assertIsStudent(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || user.role !== Role.STUDENT) {
      throw new BadRequestException('studentUserId must reference a user with role STUDENT');
    }
  }
}
