import { Column, Entity, JoinColumn, ManyToOne, OneToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';

export enum PaymentStatus {
  CURRENT = 'CURRENT',
  OUTSTANDING = 'OUTSTANDING',
  OVERDUE = 'OVERDUE',
}

// Confirmed decision: overdue tracking is manual only — TT §3.9 explicitly
// keeps attendance out of billing, so there's no automatic lesson count to
// derive this from. Staff set/toggle this directly on the payment-analytics
// page. One row per student; defaults to CURRENT until staff say otherwise.
@Entity('student_payment_statuses')
export class StudentPaymentStatus extends AppBaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  student!: Relation<User>;

  @Column({ name: 'student_user_id' })
  studentUserId!: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.CURRENT })
  status!: PaymentStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'set_by_user_id' })
  setBy?: Relation<User>;

  @Column({ name: 'set_by_user_id', nullable: true })
  setByUserId?: string;

  @Column({ name: 'set_at', type: 'timestamptz', nullable: true })
  setAt?: Date;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
