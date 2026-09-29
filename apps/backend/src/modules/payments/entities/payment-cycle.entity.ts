import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// TT §3.4: cash payment covering a block of 12 lessons, recorded manually.
// No online payment, discounts, invoices, instalments, or refunds in scope.
@Entity('payment_cycles')
export class PaymentCycle extends AppBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  student!: Relation<User>;

  @Column({ name: 'student_user_id' })
  studentUserId!: string;

  @Column({ name: 'cycle_number' })
  cycleNumber!: number;

  @Column({ name: 'lessons_count', default: 12 })
  lessonsCount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt!: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recorded_by_user_id' })
  recordedBy?: Relation<User>;

  @Column({ name: 'recorded_by_user_id', nullable: true })
  recordedByUserId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
