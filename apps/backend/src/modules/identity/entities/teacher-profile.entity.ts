import { Column, Entity, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from './user.entity.js';

@Entity('teacher_profiles')
export class TeacherProfile extends AppBaseEntity {
  @OneToOne(() => User, (user) => user.teacherProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ name: 'user_id' })
  userId!: string;

  // Short public tagline distinct from the bio, e.g. "Networking teacher".
  @Column({ name: 'title_en', nullable: true })
  titleEn?: string;

  @Column({ name: 'title_ru', nullable: true })
  titleRu?: string;

  @Column({ name: 'title_uz_latn', nullable: true })
  titleUzLatn?: string;

  @Column({ name: 'title_uz_cyrl', nullable: true })
  titleUzCyrl?: string;

  // Per-locale bio shown on the public teacher profile (TT §3.1).
  @Column({ name: 'bio_en', type: 'text', nullable: true })
  bioEn?: string;

  @Column({ name: 'bio_ru', type: 'text', nullable: true })
  bioRu?: string;

  @Column({ name: 'bio_uz_latn', type: 'text', nullable: true })
  bioUzLatn?: string;

  @Column({ name: 'bio_uz_cyrl', type: 'text', nullable: true })
  bioUzCyrl?: string;

  @Column({ name: 'public_photo_url', nullable: true })
  publicPhotoUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  subjects?: string[];

  // e.g. ["Русский", "English"] — shown as "Teaches in" on the public profile.
  @Column({ name: 'teaching_languages', type: 'simple-array', nullable: true })
  teachingLanguages?: string[];

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;
}
