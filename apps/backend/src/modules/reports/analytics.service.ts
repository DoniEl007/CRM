import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { User } from '../identity/entities/user.entity.js';
import { Group } from '../groups/entities/group.entity.js';
import { GroupMembership } from '../groups/entities/group-membership.entity.js';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity.js';
import { PaymentCycle } from '../payments/entities/payment-cycle.entity.js';
import { StudentPaymentStatus, PaymentStatus } from '../payments/entities/student-payment-status.entity.js';
import { Submission, SubmissionStatus } from '../tasks/entities/submission.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { Request as CrmRequest, RequestStatus } from '../crm/entities/request.entity.js';

const TREND_MONTHS = 6;

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMembership) private readonly membershipsRepo: Repository<GroupMembership>,
    @InjectRepository(AttendanceRecord) private readonly attendanceRepo: Repository<AttendanceRecord>,
    @InjectRepository(PaymentCycle) private readonly cyclesRepo: Repository<PaymentCycle>,
    @InjectRepository(StudentPaymentStatus) private readonly statusRepo: Repository<StudentPaymentStatus>,
    @InjectRepository(Submission) private readonly submissionsRepo: Repository<Submission>,
    @InjectRepository(Task) private readonly tasksRepo: Repository<Task>,
    @InjectRepository(CrmRequest) private readonly requestsRepo: Repository<CrmRequest>,
  ) {}

  async getOverview() {
    const [
      activeStudents,
      totalTeachers,
      totalGroups,
      totalRevenueAllTime,
      outstandingCount,
      enrollmentTrend,
      revenueByMonth,
      attendanceRateByGroup,
      teacherPerformance,
      topStudents,
    ] = await Promise.all([
      this.usersRepo.count({ where: { role: Role.STUDENT, isActive: true } }),
      this.usersRepo.count({ where: { role: Role.TEACHER } }),
      this.groupsRepo.count(),
      this.totalRevenue(),
      this.statusRepo.count({ where: [{ status: PaymentStatus.OUTSTANDING }, { status: PaymentStatus.OVERDUE }] }),
      this.getEnrollmentTrend(),
      this.getRevenueByMonth(),
      this.getAttendanceRateByGroup(),
      this.getTeacherPerformance(),
      this.getTopStudents(10),
    ]);

    return {
      activeStudents,
      totalTeachers,
      totalGroups,
      totalRevenueAllTime,
      outstandingCount,
      enrollmentTrend,
      revenueByMonth,
      attendanceRateByGroup,
      teacherPerformance,
      topStudents,
    };
  }

  private async totalRevenue(): Promise<string> {
    const result = await this.cyclesRepo
      .createQueryBuilder('cycle')
      .select('COALESCE(SUM(cycle.amount), 0)', 'total')
      .getRawOne<{ total: string }>();
    return result?.total ?? '0';
  }

  // Monthly count of requests that became ACTIVE vs DECLINED, over the last
  // 6 months. Both are terminal statuses (a request only reaches one once),
  // so `updated_at` is a reasonable proxy for "when this happened" without
  // needing dedicated transition-timestamp columns.
  private async getEnrollmentTrend(): Promise<Array<{ month: string; active: number; declined: number }>> {
    const rows = await this.requestsRepo
      .createQueryBuilder('r')
      .select("to_char(date_trunc('month', r.updated_at), 'YYYY-MM')", 'month')
      .addSelect('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.status IN (:...statuses)', { statuses: [RequestStatus.ACTIVE, RequestStatus.DECLINED] })
      .andWhere("r.updated_at >= NOW() - INTERVAL '6 months'")
      .groupBy("date_trunc('month', r.updated_at)")
      .addGroupBy('r.status')
      .orderBy("date_trunc('month', r.updated_at)", 'ASC')
      .getRawMany<{ month: string; status: RequestStatus; count: string }>();

    return this.mergeByMonth(rows, (row) => ({
      active: row.status === RequestStatus.ACTIVE ? Number(row.count) : 0,
      declined: row.status === RequestStatus.DECLINED ? Number(row.count) : 0,
    }));
  }

  private async getRevenueByMonth(): Promise<Array<{ month: string; amount: string }>> {
    const rows = await this.cyclesRepo
      .createQueryBuilder('cycle')
      .select("to_char(date_trunc('month', cycle.paid_at), 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(cycle.amount), 0)', 'amount')
      .where("cycle.paid_at >= NOW() - INTERVAL '6 months'")
      .groupBy("date_trunc('month', cycle.paid_at)")
      .orderBy("date_trunc('month', cycle.paid_at)", 'ASC')
      .getRawMany<{ month: string; amount: string }>();
    return rows;
  }

  private async getAttendanceRateByGroup(): Promise<Array<{ groupId: string; groupName: string; ratePercent: number }>> {
    const groups = await this.groupsRepo.find();
    const results = [];
    for (const group of groups) {
      const [present, total] = await Promise.all([
        this.attendanceRepo.count({ where: { groupId: group.id, present: true } }),
        this.attendanceRepo.count({ where: { groupId: group.id } }),
      ]);
      results.push({
        groupId: group.id,
        groupName: group.name,
        ratePercent: total === 0 ? 0 : Math.round((present / total) * 100),
      });
    }
    return results;
  }

  private async getTeacherPerformance(): Promise<
    Array<{ teacherUserId: string; firstName: string; lastName: string; avgCorrectPercent: number; attendanceRatePercent: number }>
  > {
    const teachers = await this.usersRepo.find({ where: { role: Role.TEACHER } });
    const results = [];
    for (const teacher of teachers) {
      const groups = await this.groupsRepo.find({ where: { teacherUserId: teacher.id } });
      const groupIds = groups.map((g) => g.id);

      let avgCorrectPercent = 0;
      let attendanceRatePercent = 0;
      if (groupIds.length > 0) {
        const tasks = await this.tasksRepo.find({ where: groupIds.map((groupId) => ({ groupId })) });
        const taskIds = tasks.map((t) => t.id);

        if (taskIds.length > 0) {
          const submissions = await this.submissionsRepo
            .createQueryBuilder('s')
            .where('s.task_id IN (:...taskIds)', { taskIds })
            .andWhere('s.status = :status', { status: SubmissionStatus.GRADED })
            .getMany();
          const totals = submissions.reduce(
            (acc, s) => ({ correct: acc.correct + (s.correctCount ?? 0), total: acc.total + (s.totalCount ?? 0) }),
            { correct: 0, total: 0 },
          );
          avgCorrectPercent = totals.total === 0 ? 0 : Math.round((totals.correct / totals.total) * 100);
        }

        const [present, total] = await Promise.all([
          this.attendanceRepo
            .createQueryBuilder('a')
            .where('a.group_id IN (:...groupIds)', { groupIds })
            .andWhere('a.present = true')
            .getCount(),
          this.attendanceRepo.createQueryBuilder('a').where('a.group_id IN (:...groupIds)', { groupIds }).getCount(),
        ]);
        attendanceRatePercent = total === 0 ? 0 : Math.round((present / total) * 100);
      }

      results.push({
        teacherUserId: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        avgCorrectPercent,
        attendanceRatePercent,
      });
    }
    return results;
  }

  // Global leaderboard (unlike the per-group rating in TasksService), across
  // every group a student belongs to.
  private async getTopStudents(
    limit: number,
  ): Promise<Array<{ studentUserId: string; firstName: string; lastName: string; correctCount: number; totalCount: number }>> {
    const rows = await this.submissionsRepo
      .createQueryBuilder('s')
      .select('s.student_user_id', 'studentUserId')
      .addSelect('COALESCE(SUM(s.correct_count), 0)', 'correctCount')
      .addSelect('COALESCE(SUM(s.total_count), 0)', 'totalCount')
      .where('s.status = :status', { status: SubmissionStatus.GRADED })
      .groupBy('s.student_user_id')
      .orderBy('SUM(s.correct_count)', 'DESC')
      .limit(limit)
      .getRawMany<{ studentUserId: string; correctCount: string; totalCount: string }>();

    const students =
      rows.length === 0 ? [] : await this.usersRepo.findBy(rows.map((r) => ({ id: r.studentUserId })));
    const byId = new Map(students.map((s) => [s.id, s]));

    return rows.map((r) => ({
      studentUserId: r.studentUserId,
      firstName: byId.get(r.studentUserId)?.firstName ?? '',
      lastName: byId.get(r.studentUserId)?.lastName ?? '',
      correctCount: Number(r.correctCount),
      totalCount: Number(r.totalCount),
    }));
  }

  private mergeByMonth<T extends Record<string, number>>(
    rows: Array<{ month: string } & Record<string, unknown>>,
    mapRow: (row: any) => T,
  ): Array<{ month: string } & T> {
    const byMonth = new Map<string, T>();
    for (const row of rows) {
      const mapped = mapRow(row);
      const existing = byMonth.get(row.month);
      if (existing) {
        for (const key of Object.keys(mapped)) {
          (existing as any)[key] += mapped[key];
        }
      } else {
        byMonth.set(row.month, { ...mapped });
      }
    }
    return Array.from(byMonth.entries()).map(([month, values]) => ({ month, ...values }));
  }
}
