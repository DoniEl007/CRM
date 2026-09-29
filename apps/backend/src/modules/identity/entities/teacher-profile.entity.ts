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
}
