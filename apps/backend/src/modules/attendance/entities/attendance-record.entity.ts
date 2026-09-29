import { Column, Entity, JoinColumn, ManyToOne, Unique, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Group } from '../../groups/entities/group.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// TT §3.9: a checkbox per student per day, not linked to billing, no
// make-up lessons. One row per (group, student, date).
@Entity('attendance_records')
@Unique(['groupId', 'studentUserId', 'date'])
export class AttendanceRecord extends AppBaseEntity {
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Relation<Group>;

  @Column({ name: 'group_id' })
  groupId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  student!: Relation<User>;

  @Column({ name: 'student_user_id' })
  studentUserId!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ default: true })
  present!: boolean;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'marked_by_user_id' })
  markedBy?: Relation<User>;

  @Column({ name: 'marked_by_user_id', nullable: true })
  markedByUserId?: string;

  @Column({ name: 'marked_at', type: 'timestamptz' })
  markedAt!: Date;
}
