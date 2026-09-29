import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCycle } from './entities/payment-cycle.entity.js';
import { PaymentStatus, StudentPaymentStatus } from './entities/student-payment-status.entity.js';
import { RecordPaymentDto, SetPaymentStatusDto } from './dto/payment.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export interface PaymentAnalytics {
  totalRevenue: string;
  totalPayments: number;
  flaggedStudents: StudentPaymentStatus[];
  recentPayments: PaymentCycle[];
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentCycle) private readonly cyclesRepo: Repository<PaymentCycle>,
    @InjectRepository(StudentPaymentStatus)
    private readonly statusRepo: Repository<StudentPaymentStatus>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async recordPayment(dto: RecordPaymentDto, recordedByUserId: string): Promise<PaymentCycle> {
    const existingCount = await this.cyclesRepo.count({ where: { studentUserId: dto.studentUserId } });
    return this.cyclesRepo.save(
      this.cyclesRepo.create({
        studentUserId: dto.studentUserId,
        cycleNumber: existingCount + 1,
        amount: dto.amount,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        recordedByUserId,
        notes: dto.notes,
      }),
    );
  }

  listForStudent(studentUserId: string): Promise<PaymentCycle[]> {
    return this.cyclesRepo.find({ where: { studentUserId }, order: { cycleNumber: 'DESC' } });
  }

  async getStatus(studentUserId: string): Promise<StudentPaymentStatus> {
    const existing = await this.statusRepo.findOne({ where: { studentUserId } });
    if (existing) return existing;
    // No explicit status set yet — CURRENT is the implicit default, not
    // persisted until staff first touch it.
    return this.statusRepo.create({ studentUserId, status: PaymentStatus.CURRENT });
  }

  // Manual only (confirmed decision): staff set this directly; it is never
  // derived from attendance or the timetable.
  async setStatus(
    studentUserId: string,
    dto: SetPaymentStatusDto,
    setByUserId: string,
  ): Promise<StudentPaymentStatus> {
    let record = await this.statusRepo.findOne({ where: { studentUserId } });
    if (!record) {
      record = this.statusRepo.create({ studentUserId });
    }
    record.status = dto.status;
    record.note = dto.note;
    record.setByUserId = setByUserId;
    record.setAt = new Date();
    const saved = await this.statusRepo.save(record);

    // TT §3.11 "payment due" trigger — fires when staff flags a student as
    // outstanding/overdue (status itself stays manual per the confirmed
    // decision; only the notification is automatic).
    if (dto.status === PaymentStatus.OUTSTANDING || dto.status === PaymentStatus.OVERDUE) {
      const label = dto.status === PaymentStatus.OVERDUE ? 'overdue' : 'outstanding';
      await this.notificationsService.notifyPaymentDue(
        studentUserId,
        `Your payment is ${label}${dto.note ? `: ${dto.note}` : '.'}`,
      );
    }

    return saved;
  }

  async getAnalytics(): Promise<PaymentAnalytics> {
    const [cycles, flaggedStudents] = await Promise.all([
      this.cyclesRepo.find({ order: { paidAt: 'DESC' }, take: 50, relations: { student: true } }),
      this.statusRepo.find({
        where: [{ status: PaymentStatus.OUTSTANDING }, { status: PaymentStatus.OVERDUE }],
        relations: { student: true },
      }),
    ]);

    const totalRevenueResult = await this.cyclesRepo
      .createQueryBuilder('cycle')
      .select('COALESCE(SUM(cycle.amount), 0)', 'total')
      .getRawOne<{ total: string }>();

    const totalPayments = await this.cyclesRepo.count();

    return {
      totalRevenue: totalRevenueResult?.total ?? '0',
      totalPayments,
      flaggedStudents,
      recentPayments: cycles,
    };
  }
}
