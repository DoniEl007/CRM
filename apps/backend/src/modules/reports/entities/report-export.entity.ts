import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// TT §3.10: revenue, outstanding payments, enrollment trends, attendance
// rates, teacher/student performance — exportable with daily/weekly/monthly
// parameters. Revenue/OutstandingPayments are reachable by CEO
// (reports.export_financial) too; the other three are Full Administrator
// only (reports.export_all), per the design's "Full Administrator only"
// lock note on those report types.
export enum ReportType {
  REVENUE = 'REVENUE',
  OUTSTANDING_PAYMENTS = 'OUTSTANDING_PAYMENTS',
  ENROLLMENT = 'ENROLLMENT',
  ATTENDANCE_RATES = 'ATTENDANCE_RATES',
  TEACHER_STUDENT_PERFORMANCE = 'TEACHER_STUDENT_PERFORMANCE',
}

export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface ReportParams {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
  groupId?: string;
}

@Entity('report_exports')
export class ReportExport extends AppBaseEntity {
  @Column({ type: 'enum', enum: ReportType })
  type!: ReportType;

  @Column({ type: 'simple-json' })
  params!: ReportParams;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedBy?: Relation<User>;

  @Column({ name: 'requested_by_user_id', nullable: true })
  requestedByUserId?: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @Column({ name: 'generated_at', type: 'timestamptz', nullable: true })
  generatedAt?: Date;

  @Column({ name: 'file_key', nullable: true })
  fileKey?: string;

  @Column({ nullable: true })
  filename?: string;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes?: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;
}
