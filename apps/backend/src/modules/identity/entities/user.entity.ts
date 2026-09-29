import { Exclude } from 'class-transformer';
import { Column, Entity, Index, OneToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Role } from '../../../common/enums/role.enum.js';
import { StudentProfile } from './student-profile.entity.js';
import { TeacherProfile } from './teacher-profile.entity.js';

export type Locale = 'en' | 'ru' | 'uz-Latn' | 'uz-Cyrl';

@Entity('users')
export class User extends AppBaseEntity {
  @Index({ unique: true })
  @Column()
  email!: string;

  // Never serialized in API responses — see main.ts's global
  // ClassSerializerInterceptor. A prior bug let this leak through relations
  // (e.g. payment analytics' nested `student`, CRM activation's `user`)
  // because those endpoints returned raw entities with no sanitization.
  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'preferred_locale', type: 'varchar', default: 'en' })
  preferredLocale!: Locale;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile?: Relation<StudentProfile>;

  @OneToOne(() => TeacherProfile, (profile) => profile.user)
  teacherProfile?: Relation<TeacherProfile>;
}
