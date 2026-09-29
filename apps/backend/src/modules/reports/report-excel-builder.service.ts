import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Between, Repository } from 'typeorm';
import { Group } from '../groups/entities/group.entity.js';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity.js';
import { PaymentCycle } from '../payments/entities/payment-cycle.entity.js';
import { StudentPaymentStatus, PaymentStatus } from '../payments/entities/student-payment-status.entity.js';
import { Request as CrmRequest } from '../crm/entities/request.entity.js';
import { AnalyticsService } from './analytics.service.js';
import { ReportPeriod, ReportType, type ReportParams } from './entities/report-export.entity.js';

const SQL_TRUNC_UNIT: Record<ReportPeriod, string> = {
  [ReportPeriod.DAILY]: 'day',
  [ReportPeriod.WEEKLY]: 'week',
  [ReportPeriod.MONTHLY]: 'month',
};

@Injectable()
export class ReportExcelBuilderService {
  constructor(
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(AttendanceRecord) private readonly attendanceRepo: Repository<AttendanceRecord>,
    @InjectRepository(PaymentCycle) private readonly cyclesRepo: Repository<PaymentCycle>,
    @InjectRepository(StudentPaymentStatus) private readonly statusRepo: Repository<StudentPaymentStatus>,
    @InjectRepository(CrmRequest) private readonly requestsRepo: Repository<CrmRequest>,
    private readonly analytics: AnalyticsService,
  ) {}

  async build(type: ReportType, params: ReportParams): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.created = new Date();

    switch (type) {
      case ReportType.REVENUE:
        await this.buildRevenue(workbook, params);
        break;
      case ReportType.OUTSTANDING_PAYMENTS:
        await this.buildOutstanding(workbook);
        break;
      case ReportType.ENROLLMENT:
        await this.buildEnrollment(workbook, params);
        break;
      case ReportType.ATTENDANCE_RATES:
        await this.buildAttendance(workbook, params);
        break;
      case ReportType.TEACHER_STUDENT_PERFORMANCE:
        await this.buildPerformance(workbook);
        break;
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  private dateRange(params: ReportParams): [Date, Date] {
    return [new Date(params.startDate), new Date(params.endDate)];
  }

  private async buildRevenue(workbook: ExcelJS.Workbook, params: ReportParams): Promise<void> {
    const [start, end] = this.dateRange(params);
    const cycles = await this.cyclesRepo.find({
      where: { paidAt: Between(start, end) },
      relations: { student: true },
      order: { paidAt: 'ASC' },
    });

    const summary = workbook.addWorksheet('Summary');
    const total = cycles.reduce((sum, c) => sum + Number(c.amount), 0);
    summary.addRows([
      ['Report', 'Revenue'],
      ['Period', params.period],
      ['From', params.startDate],
      ['To', params.endDate],
      ['Total payments', cycles.length],
      ['Total revenue', total],
    ]);

    const byPeriod = workbook.addWorksheet('By period');
    byPeriod.addRow(['Period start', 'Revenue', 'Payment count']);
    const periodRows = await this.cyclesRepo
      .createQueryBuilder('cycle')
      .select(`date_trunc('${SQL_TRUNC_UNIT[params.period]}', cycle.paid_at)`, 'periodStart')
      .addSelect('COALESCE(SUM(cycle.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('cycle.paid_at BETWEEN :start AND :end', { start, end })
      .groupBy('"periodStart"')
      .orderBy('"periodStart"', 'ASC')
      .getRawMany<{ periodStart: Date; total: string; count: string }>();
    for (const row of periodRows) {
      byPeriod.addRow([row.periodStart.toISOString().slice(0, 10), Number(row.total), Number(row.count)]);
    }

    const paymentsSheet = workbook.addWorksheet('Payments');
    paymentsSheet.addRow(['Student', 'Cycle #', 'Amount', 'Paid at', 'Notes']);
    for (const cycle of cycles) {
      paymentsSheet.addRow([
        `${cycle.student.firstName} ${cycle.student.lastName}`,
        cycle.cycleNumber,
        Number(cycle.amount),
        cycle.paidAt.toISOString().slice(0, 10),
        cycle.notes ?? '',
      ]);
    }
  }

  private async buildOutstanding(workbook: ExcelJS.Workbook): Promise<void> {
    const rows = await this.statusRepo.find({
      where: [{ status: PaymentStatus.OUTSTANDING }, { status: PaymentStatus.OVERDUE }],
      relations: { student: true },
      order: { setAt: 'DESC' },
    });

    const sheet = workbook.addWorksheet('Outstanding payments');
    sheet.addRow(['Student', 'Status', 'Note', 'Set at']);
    for (const row of rows) {
      sheet.addRow([
        `${row.student.firstName} ${row.student.lastName}`,
        row.status,
        row.note ?? '',
        row.setAt?.toISOString().slice(0, 10) ?? '',
      ]);
    }
  }

  private async buildEnrollment(workbook: ExcelJS.Workbook, params: ReportParams): Promise<void> {
    const [start, end] = this.dateRange(params);
    const rows = await this.requestsRepo
      .createQueryBuilder('r')
      .select(`date_trunc('${SQL_TRUNC_UNIT[params.period]}', r.updated_at)`, 'periodStart')
      .addSelect('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.updated_at BETWEEN :start AND :end', { start, end })
      .groupBy('"periodStart"')
      .addGroupBy('r.status')
      .orderBy('"periodStart"', 'ASC')
      .getRawMany<{ periodStart: Date; status: string; count: string }>();

    const sheet = workbook.addWorksheet('Enrollment');
    sheet.addRow(['Period start', 'Status', 'Count']);
    for (const row of rows) {
      sheet.addRow([row.periodStart.toISOString().slice(0, 10), row.status, Number(row.count)]);
    }
  }

  private async buildAttendance(workbook: ExcelJS.Workbook, params: ReportParams): Promise<void> {
    const groups = params.groupId
      ? await this.groupsRepo.find({ where: { id: params.groupId } })
      : await this.groupsRepo.find();

    const sheet = workbook.addWorksheet('Attendance by group');
    sheet.addRow(['Group', 'Present', 'Absent', 'Total', 'Rate %']);
    for (const group of groups) {
      const dateRange = Between(params.startDate, params.endDate);
      const [present, total] = await Promise.all([
        this.attendanceRepo.count({ where: { groupId: group.id, present: true, date: dateRange } }),
        this.attendanceRepo.count({ where: { groupId: group.id, date: dateRange } }),
      ]);
      sheet.addRow([group.name, present, total - present, total, total === 0 ? 0 : Math.round((present / total) * 100)]);
    }
  }

  private async buildPerformance(workbook: ExcelJS.Workbook): Promise<void> {
    const overview = await this.analytics.getOverview();

    const teacherSheet = workbook.addWorksheet('Teacher performance');
    teacherSheet.addRow(['Teacher', 'Avg correct %', 'Attendance %']);
    for (const t of overview.teacherPerformance) {
      teacherSheet.addRow([`${t.firstName} ${t.lastName}`, t.avgCorrectPercent, t.attendanceRatePercent]);
    }

    const studentSheet = workbook.addWorksheet('Top students');
    studentSheet.addRow(['Student', 'Correct', 'Total', 'Percent']);
    for (const s of overview.topStudents) {
      studentSheet.addRow([
        `${s.firstName} ${s.lastName}`,
        s.correctCount,
        s.totalCount,
        s.totalCount === 0 ? 0 : Math.round((s.correctCount / s.totalCount) * 100),
      ]);
    }
  }
}
