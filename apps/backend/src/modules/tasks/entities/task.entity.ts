import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// TT §3.6: file uploads, text answers, multiple-choice quizzes, and
// auto-graded tests. Code submission/auto-grading is explicitly excluded.
export enum TaskType {
  FILE = 'FILE',
  TEXT = 'TEXT',
  MCQ = 'MCQ',
  AUTO_TEST = 'AUTO_TEST',
}

// No deadline field — TT §3.6: "Assignments have no deadlines."
@Entity('tasks')
export class Task extends AppBaseEntity {
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Relation<Group>;

  @Column({ name: 'group_id' })
  groupId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_user_id' })
  teacher!: Relation<User>;

  @Column({ name: 'teacher_user_id' })
  teacherUserId!: string;

  @Column({ name: 'title_en' })
  titleEn!: string;

  @Column({ name: 'title_ru' })
  titleRu!: string;

  @Column({ name: 'title_uz_latn' })
  titleUzLatn!: string;

  @Column({ name: 'title_uz_cyrl' })
  titleUzCyrl!: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_ru', type: 'text', nullable: true })
  descriptionRu?: string;

  @Column({ name: 'description_uz_latn', type: 'text', nullable: true })
  descriptionUzLatn?: string;

  @Column({ name: 'description_uz_cyrl', type: 'text', nullable: true })
  descriptionUzCyrl?: string;

  @Column({ type: 'enum', enum: TaskType })
  type!: TaskType;

  // Object-storage key (MinIO), set once the dedicated file-upload endpoint
  // exists. Up to 5 GB per TT §2.4 — stored as an opaque key, never in the DB.
  @Column({ name: 'attachment_file_key', nullable: true })
  attachmentFileKey?: string;
}
