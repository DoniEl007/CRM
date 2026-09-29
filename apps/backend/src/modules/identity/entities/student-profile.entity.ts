import { Column, Entity, JoinColumn, OneToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from './user.entity.js';

@Entity('student_profiles')
export class StudentProfile extends AppBaseEntity {
  @OneToOne(() => User, (user) => user.studentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ name: 'user_id' })
  userId!: string;

  // Recorded by the student on their own panel per TT §3.7 / §6.1.
  // Parent has no login/account of their own.
  @Column({ name: 'parent_telegram_username', nullable: true })
  parentTelegramUsername?: string;

  // Populated once the parent completes the /start deep-link flow (TT §6.1).
  @Column({ name: 'parent_chat_id', nullable: true })
  parentChatId?: string;

  @Column({ name: 'parent_linked', default: false })
  parentLinked!: boolean;

  // One-time token embedded in the t.me/<bot>?start=<token> deep link (TT
  // §6.1). Cleared once the parent completes /start and parentLinked is set.
  @Column({ name: 'parent_link_token', nullable: true })
  parentLinkToken?: string;

  @Column({ name: 'enrollment_date', type: 'date', nullable: true })
  enrollmentDate?: string;

  // Collected at enrollment per the design's "New student & login" screen.
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string;
}
