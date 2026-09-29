import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';
import { Course } from '../../catalog/entities/course.entity.js';
import { Group } from '../../groups/entities/group.entity.js';

export enum RequestSource {
  WEBSITE = 'WEBSITE',
  MANUAL = 'MANUAL',
}

// Lifecycle per TT §3.2: request -> one trial lesson -> active | declined.
// TRIAL_DONE marks "the trial happened, staff still needs to decide"; it is
// not itself a TT-named stage but makes that pending decision visible in the
// pipeline instead of leaving it implicit.
export enum RequestStatus {
  NEW = 'NEW',
  TRIAL_SCHEDULED = 'TRIAL_SCHEDULED',
  TRIAL_DONE = 'TRIAL_DONE',
  ACTIVE = 'ACTIVE',
  DECLINED = 'DECLINED',
}

@Entity('requests')
export class Request extends AppBaseEntity {
  @Column({ name: 'full_name' })
  fullName!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'enum', enum: RequestSource })
  source!: RequestSource;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.NEW })
  status!: RequestStatus;

  @Column({ name: 'decline_reason', nullable: true })
  declineReason?: string;

  @Column({ name: 'trial_lesson_at', type: 'timestamptz', nullable: true })
  trialLessonAt?: Date;

  // Original message from the public contact form, if any (distinct from
  // `notes`, which staff add afterwards).
  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'course_interest_id' })
  courseInterest?: Relation<Course>;

  @Column({ name: 'course_interest_id', nullable: true })
  courseInterestId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'converted_student_user_id' })
  convertedStudent?: Relation<User>;

  @Column({ name: 'converted_student_user_id', nullable: true })
  convertedStudentUserId?: string;

  // The group this candidate is being considered for — set when scheduling
  // the trial (design shows it on the trial record alongside the teacher and
  // room) and used to pre-fill enrollment at activation. Not a guarantee:
  // staff can still enroll into a different group at activation time.
  @ManyToOne(() => Group, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_group_id' })
  assignedGroup?: Relation<Group>;

  @Column({ name: 'assigned_group_id', nullable: true })
  assignedGroupId?: string;
}
