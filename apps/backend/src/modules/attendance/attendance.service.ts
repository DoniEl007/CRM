import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupsService } from '../groups/groups.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { AttendanceRecord } from './entities/attendance-record.entity.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';

export interface RosterEntry {
  studentUserId: string;
  firstName: string;
  lastName: string;
  present: boolean | null;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord) private readonly attendanceRepo: Repository<AttendanceRecord>,
    private readonly groupsService: GroupsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Roster for a group on a given day: every enrolled student plus their
  // attendance status for that date, or null if not yet marked — the shape
  // the teacher-facing checkbox screen (TT §3.9) fills in.
  async getRoster(groupId: string, date: string): Promise<RosterEntry[]> {
    const members = await this.groupsService.getMembers(groupId);
    const records = await this.attendanceRepo.find({ where: { groupId, date } });
    const byStudent = new Map(records.map((r) => [r.studentUserId, r.present]));

    return members.map((m) => ({
      studentUserId: m.studentUserId,
      firstName: m.student.firstName,
      lastName: m.student.lastName,
      present: byStudent.has(m.studentUserId) ? byStudent.get(m.studentUserId)! : null,
    }));
  }

  async mark(groupId: string, dto: MarkAttendanceDto, markedByUserId: string): Promise<AttendanceRecord[]> {
    await this.groupsService.findByIdOrFail(groupId);
    const markedAt = new Date();

    const saved: AttendanceRecord[] = [];
    for (const entry of dto.records) {
      const existing = await this.attendanceRepo.findOne({
        where: { groupId, studentUserId: entry.studentUserId, date: dto.date },
      });

      const wasAbsent = existing?.present === false;
      const record = existing ?? this.attendanceRepo.create({ groupId, studentUserId: entry.studentUserId, date: dto.date });
      record.present = entry.present;
      record.markedByUserId = markedByUserId;
      record.markedAt = markedAt;
      saved.push(await this.attendanceRepo.save(record));

      // Only notify on the transition into absence, not on every re-save of
      // an already-absent day, to avoid spamming the parent.
      if (!entry.present && !wasAbsent) {
        await this.notificationsService.notifyAbsence(entry.studentUserId, dto.date);
      }
    }
    return saved;
  }

  findForStudent(studentUserId: string): Promise<AttendanceRecord[]> {
    return this.attendanceRepo.find({
      where: { studentUserId },
      order: { date: 'DESC' },
      relations: { group: true },
    });
  }
}
