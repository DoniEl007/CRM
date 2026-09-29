import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { Role } from '../../../common/enums/role.enum.js';
import { User } from '../entities/user.entity.js';
import { StudentProfile } from '../entities/student-profile.entity.js';
import { TeacherProfile } from '../entities/teacher-profile.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';

const BCRYPT_ROUNDS = 12;

export interface CreatedUserResult {
  user: User;
  temporaryPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(StudentProfile) private readonly studentProfilesRepo: Repository<StudentProfile>,
    @InjectRepository(TeacherProfile) private readonly teacherProfilesRepo: Repository<TeacherProfile>,
  ) {}

  // Administrative Staff may only provision Student accounts (TT §4:
  // "Register new students... create login credentials for new students").
  // Any other role must be created by Full Administrator.
  async createUser(dto: CreateUserDto, requestedByRole: Role): Promise<CreatedUserResult> {
    if (requestedByRole === Role.ADMIN_STAFF && dto.role !== Role.STUDENT) {
      throw new ForbiddenException('Administrative Staff can only create Student accounts');
    }

    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const user = await this.usersRepo.save(
      this.usersRepo.create({
        email: dto.email,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash,
      }),
    );

    if (dto.role === Role.STUDENT) {
      await this.studentProfilesRepo.save(
        this.studentProfilesRepo.create({ userId: user.id, parentLinked: false }),
      );
    } else if (dto.role === Role.TEACHER) {
      await this.teacherProfilesRepo.save(this.teacherProfilesRepo.create({ userId: user.id }));
    }

    return { user, temporaryPassword };
  }

  findAll(role?: Role): Promise<User[]> {
    return this.usersRepo.find({ where: role ? { role } : {}, order: { createdAt: 'DESC' } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async deactivate(id: string): Promise<void> {
    await this.usersRepo.update({ id }, { isActive: false });
  }
}

function generateTemporaryPassword(): string {
  return randomBytes(9).toString('base64url');
}
