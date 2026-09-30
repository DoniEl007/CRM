import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '../../redis/redis.module.js';
import { ScheduleSlot, DayOfWeek } from '../groups/entities/schedule-slot.entity.js';
import { GroupsService } from '../groups/groups.service.js';
import { NotificationsService } from './notifications.service.js';

// TT §3.11's "class reminder" trigger: notifies a group's teacher and every
// enrolled student ~1 hour before a scheduled lesson. ScheduleSlot only
// stores a recurring weekly pattern (day + time), not concrete calendar
// occurrences, so "already reminded for this occurrence" is tracked with a
// short-lived Redis key rather than a new DB table — a transient scheduling
// concern, not data the platform needs to keep.
const REMINDER_WINDOW_MIN_MINUTES = 55;
const REMINDER_WINDOW_MAX_MINUTES = 65;
const DEDUPE_TTL_SECONDS = 6 * 60 * 60;

const DAY_INDEX: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

@Injectable()
export class ClassReminderScannerService {
  private readonly logger = new Logger(ClassReminderScannerService.name);

  constructor(
    @InjectRepository(ScheduleSlot) private readonly slotsRepo: Repository<ScheduleSlot>,
    private readonly groupsService: GroupsService,
    private readonly notificationsService: NotificationsService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async scan(now: Date = new Date()): Promise<void> {
    const todayDayOfWeek = DAY_INDEX[now.getDay()];
    const slots = await this.slotsRepo.find({
      where: { dayOfWeek: todayDayOfWeek },
      relations: { group: true },
    });

    for (const slot of slots) {
      const minutesUntilStart = this.minutesUntil(now, slot.startTime);
      if (minutesUntilStart < REMINDER_WINDOW_MIN_MINUTES || minutesUntilStart > REMINDER_WINDOW_MAX_MINUTES) {
        continue;
      }

      const dedupeKey = `class-reminder-sent:${slot.id}:${now.toISOString().slice(0, 10)}`;
      const alreadySent = await this.redis.set(dedupeKey, '1', 'EX', DEDUPE_TTL_SECONDS, 'NX');
      if (alreadySent !== 'OK') continue; // another process already handled this slot today

      await this.sendReminders(slot);
    }
  }

  private async sendReminders(slot: ScheduleSlot): Promise<void> {
    const startTime = slot.startTime.slice(0, 5); // "HH:mm:ss" -> "HH:mm"
    const groupName = slot.group.name;

    try {
      await this.notificationsService.notifyClassReminder(slot.group.teacherUserId, groupName, startTime);
      const members = await this.groupsService.getMembers(slot.groupId);
      for (const member of members) {
        await this.notificationsService.notifyClassReminder(member.studentUserId, groupName, startTime);
      }
    } catch (err) {
      this.logger.warn(`Failed to send class reminders for slot ${slot.id}: ${(err as Error).message}`);
    }
  }

  // Minutes from `now` until the next occurrence of `timeOfDay` ("HH:mm:ss")
  // on `now`'s own calendar date.
  private minutesUntil(now: Date, timeOfDay: string): number {
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / 60000);
  }
}
