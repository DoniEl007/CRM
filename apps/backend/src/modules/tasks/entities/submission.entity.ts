import { Column, Entity, JoinColumn, ManyToOne, Unique, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Task } from './task.entity.js';
import { User } from '../../identity/entities/user.entity.js';

export enum SubmissionStatus {
  PENDING = 'PENDING',
  GRADED = 'GRADED',
}

export interface McqAnswer {
  questionId: string;
  selectedOptionIndex: number;
}

// One submission per (task, student) — resubmission before grading replaces
// it in place; once GRADED, further submission attempts are rejected to
// protect the recorded grade (enforced in TasksService, not here).
@Entity('submissions')
@Unique(['taskId', 'studentUserId'])
export class Submission extends AppBaseEntity {
  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Relation<Task>;

  @Column({ name: 'task_id' })
  taskId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  student!: Relation<User>;

  @Column({ name: 'student_user_id' })
  studentUserId!: string;

  @Column({ name: 'text_answer', type: 'text', nullable: true })
  textAnswer?: string;

  // Object-storage key (MinIO) for FILE-type submissions.
  @Column({ name: 'file_key', nullable: true })
  fileKey?: string;

  @Column({ type: 'simple-json', nullable: true })
  answers?: McqAnswer[];

  @Column({ name: 'correct_count', nullable: true })
  correctCount?: number;

  @Column({ name: 'total_count', nullable: true })
  totalCount?: number;

  @Column({ type: 'enum', enum: SubmissionStatus, default: SubmissionStatus.PENDING })
  status!: SubmissionStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'graded_by_user_id' })
  gradedBy?: Relation<User>;

  @Column({ name: 'graded_by_user_id', nullable: true })
  gradedByUserId?: string;

  @Column({ name: 'graded_at', type: 'timestamptz', nullable: true })
  gradedAt?: Date;

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;
}
