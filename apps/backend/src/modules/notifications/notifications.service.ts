import { Injectable, Logger } from '@nestjs/common';

// Placeholder pending the real Telegram-bot notifications module (TT §6.1/
// §3.11): parent absence linking, the notification queue, and NotificationLog
// all land there. Other modules depend on this interface now so they don't
// need rework when that lands — only this implementation gets swapped.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async notifyAbsence(studentUserId: string, date: string): Promise<void> {
    this.logger.log(`[stub] Would notify parent of student ${studentUserId} about absence on ${date}`);
  }
}
