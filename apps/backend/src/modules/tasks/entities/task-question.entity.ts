import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Task } from './task.entity.js';

// Questions for MCQ / AUTO_TEST tasks. Single-language for now (question
// text isn't localized like Task/Course titles) — a pragmatic simplification
// given the added complexity of per-locale nested question banks; can be
// extended the same way Task/Course were if the client needs it.
@Entity('task_questions')
export class TaskQuestion extends AppBaseEntity {
  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task!: Relation<Task>;

  @Column({ name: 'task_id' })
  taskId!: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder!: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText!: string;

  @Column({ type: 'simple-json' })
  options!: string[];

  @Column({ name: 'correct_option_index' })
  correctOptionIndex!: number;
}
