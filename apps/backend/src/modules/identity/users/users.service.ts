import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import { Role } from '../../../common/enums/role.enum.js';
import { User, type Locale } from '../entities/user.entity.js';
import { StudentProfile } from '../entities/student-profile.entity.js';
import { TeacherProfile } from '../entities/teacher-profile.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';

const BCRYPT_ROUNDS = 12;

export interface CreatedUserResult {
  user: User;
  temporaryPassword: string;
}

export interface UpdateStudentProfileInput {
  parentTelegramUsername?: string;
  dateOfBirth?: string;
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

  // Same provisioning restriction as createUser: Admin Staff may only reset
  // a Student's password.
  async regeneratePassword(userId: string, requestedByRole: Role): Promise<CreatedUserResult> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (requestedByRole === Role.ADMIN_STAFF && user.role !== Role.STUDENT) {
      throw new ForbiddenException('Administrative Staff can only reset Student passwords');
    }

    const temporaryPassword = generateTemporaryPassword();
    user.passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
    await this.usersRepo.save(user);
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

  async updatePreferredLocale(userId: string, locale: Locale): Promise<void> {
    await this.usersRepo.update({ id: userId }, { preferredLocale: locale });
  }

  async updateAvatarUrl(userId: string, avatarUrl: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { avatarUrl });
  }

  // Used at student activation (parent Telegram username + date of birth are
  // collected in the same "New student & login" step, per the design) and
  // later from the student's own profile.
  async updateStudentProfile(userId: string, input: UpdateStudentProfileInput): Promise<StudentProfile> {
    let profile = await this.studentProfilesRepo.findOne({ where: { userId } });
    if (!profile) profile = this.studentProfilesRepo.create({ userId, parentLinked: false });

    if (input.parentTelegramUsername !== undefined) {
      profile.parentTelegramUsername = input.parentTelegramUsername;
    }
    if (input.dateOfBirth !== undefined) {
      profile.dateOfBirth = input.dateOfBirth;
    }
    return this.studentProfilesRepo.save(profile);
  }

  async getStudentProfile(userId: string): Promise<StudentProfile | null> {
    return this.studentProfilesRepo.findOne({ where: { userId } });
  }

  // Generates the one-time token embedded in the t.me/<bot>?start=<token>
  // deep link (TT §6.1). Regenerating invalidates any previous token for
  // this student, so only the latest link/QR code works.
  async generateParentLinkToken(userId: string): Promise<string> {
    let profile = await this.studentProfilesRepo.findOne({ where: { userId } });
    if (!profile) profile = this.studentProfilesRepo.create({ userId, parentLinked: false });

    profile.parentLinkToken = randomBytes(12).toString('base64url');
    await this.studentProfilesRepo.save(profile);
    return profile.parentLinkToken;
  }

  findStudentProfileByLinkToken(token: string): Promise<StudentProfile | null> {
    return this.studentProfilesRepo.findOne({ where: { parentLinkToken: token } });
  }

  // Completes the /start linking flow: the token is single-use, so it's
  // cleared once consumed. A raw `() => 'NULL'` SET fragment is used for the
  // token column since `Repository.update()` would otherwise drop an
  // `undefined` property from the SET clause entirely rather than clearing
  // it to NULL.
  async linkParentChat(userId: string, chatId: string): Promise<void> {
    await this.studentProfilesRepo
      .createQueryBuilder()
      .update(StudentProfile)
      .set({ parentChatId: chatId, parentLinked: true, parentLinkToken: () => 'NULL' })
      .where('user_id = :userId', { userId })
      .execute();
  }

  // Same one-time /start pattern, for a user linking their own Telegram
  // (rather than a parent's) — see the User entity's telegramChatId comment.
  async generateOwnTelegramLinkToken(userId: string): Promise<string> {
    const token = randomBytes(12).toString('base64url');
    await this.usersRepo.update({ id: userId }, { telegramLinkToken: token });
    return token;
  }

  findUserByTelegramLinkToken(token: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { telegramLinkToken: token } });
  }

  async linkOwnTelegramChat(userId: string, chatId: string): Promise<void> {
    await this.usersRepo
      .createQueryBuilder()
      .update(User)
      .set({ telegramChatId: chatId, telegramLinkToken: () => 'NULL' })
      .where('id = :userId', { userId })
      .execute();
  }
}

// Human-friendly "Word-NNNN-Word" shape (e.g. "Sky-7429-Nord") — easier for
// staff to read aloud and write down when handing it to a student in person
// than an opaque random string, per the design's "New student & login" screen.
const PASSWORD_WORDS = [
  'Sky', 'Nord', 'Leaf', 'Comet', 'Ridge', 'Delta', 'Coral', 'Ember',
  'Pixel', 'Vega', 'Atlas', 'Nova', 'Cedar', 'Quartz', 'Orbit', 'Maple',
];

function generateTemporaryPassword(): string {
  const first = PASSWORD_WORDS[randomInt(PASSWORD_WORDS.length)];
  let second = PASSWORD_WORDS[randomInt(PASSWORD_WORDS.length)];
  while (second === first) second = PASSWORD_WORDS[randomInt(PASSWORD_WORDS.length)];
  const digits = randomInt(1000, 10000);
  return `${first}-${digits}-${second}`;
}
