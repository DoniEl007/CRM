import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { UsersService } from '../identity/users/users.service.js';
import { NotificationLog, NotificationStatus, RecipientType } from './entities/notification-log.entity.js';
import { NotificationType } from './entities/notification-setting.entity.js';
import { NotificationSettingsService } from './notification-settings.service.js';

export const TELEGRAM_QUEUE = 'telegram-notifications';

export interface SendNotificationJob {
  logId: string;
}

// Replaces the earlier stub. Every send goes through NotificationLog (for
// audit/visibility, per the design's admin screens) and the BullMQ queue
// (per TT §2.5 — outbound Telegram sends run through a worker, not inline).
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationLog) private readonly logsRepo: Repository<NotificationLog>,
    @InjectQueue(TELEGRAM_QUEUE) private readonly queue: Queue<SendNotificationJob>,
    private readonly settings: NotificationSettingsService,
    private readonly usersService: UsersService,
  ) {}

  // TT §6.1: absence goes to the linked parent chat_id. If the parent
  // hasn't completed /start linking yet, delivery is impossible — logged as
  // FAILED for visibility rather than silently dropped.
  async notifyAbsence(studentUserId: string, date: string): Promise<void> {
    if (!(await this.settings.isEnabled(NotificationType.ABSENCE))) return;

    const [profile, student] = await Promise.all([
      this.usersService.getStudentProfile(studentUserId),
      this.usersService.findById(studentUserId),
    ]);
    const message = `${student?.firstName ?? 'Student'} ${student?.lastName ?? ''} was marked absent on ${date}.`.trim();

    if (!profile?.parentLinked || !profile.parentChatId) {
      await this.logsRepo.save(
        this.logsRepo.create({
          recipientType: RecipientType.PARENT,
          type: NotificationType.ABSENCE,
          message,
          status: NotificationStatus.FAILED,
          errorMessage: 'Parent not linked',
        }),
      );
      return;
    }

    await this.enqueue(RecipientType.PARENT, NotificationType.ABSENCE, message, {
      recipientChatId: profile.parentChatId,
    });
  }

  async notifyPaymentDue(studentUserId: string, message: string): Promise<void> {
    await this.notifyUser(studentUserId, NotificationType.PAYMENT_DUE, message);
  }

  async notifyNewAssignment(studentUserId: string, taskTitle: string): Promise<void> {
    await this.notifyUser(studentUserId, NotificationType.NEW_ASSIGNMENT, `New task assigned: ${taskTitle}`);
  }

  async notifyGradePosted(studentUserId: string, taskTitle: string, correctCount: number, totalCount: number): Promise<void> {
    await this.notifyUser(
      studentUserId,
      NotificationType.GRADE_POSTED,
      `Your task "${taskTitle}" was graded: ${correctCount}/${totalCount} correct.`,
    );
  }

  async notifyClassReminder(userId: string, groupName: string, startTime: string): Promise<void> {
    await this.notifyUser(userId, NotificationType.CLASS_REMINDER, `Reminder: ${groupName} starts at ${startTime}.`);
  }

  // The other 4 event types (TT §3.11) target "the relevant platform user"
  // directly, via that user's own linked Telegram chat (see User entity).
  private async notifyUser(userId: string, type: NotificationType, message: string): Promise<void> {
    if (!(await this.settings.isEnabled(type))) return;

    const user = await this.usersService.findById(userId);
    if (!user?.telegramChatId) {
      await this.logsRepo.save(
        this.logsRepo.create({
          recipientType: RecipientType.USER,
          recipientUserId: userId,
          type,
          message,
          status: NotificationStatus.FAILED,
          errorMessage: 'User has not linked Telegram',
        }),
      );
      return;
    }

    await this.enqueue(RecipientType.USER, type, message, {
      recipientUserId: userId,
      recipientChatId: user.telegramChatId,
    });
  }

  private async enqueue(
    recipientType: RecipientType,
    type: NotificationType,
    message: string,
    extra: { recipientUserId?: string; recipientChatId: string },
  ): Promise<void> {
    const log = await this.logsRepo.save(
      this.logsRepo.create({
        recipientType,
        type,
        message,
        status: NotificationStatus.QUEUED,
        recipientUserId: extra.recipientUserId,
        recipientChatId: extra.recipientChatId,
      }),
    );
    await this.queue.add('send', { logId: log.id });
  }

  listRecent(limit = 100): Promise<NotificationLog[]> {
    return this.logsRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
