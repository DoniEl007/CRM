import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { NotificationLog, NotificationStatus } from './entities/notification-log.entity.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';
import { TelegramApiService } from './telegram-api.service.js';
import { TELEGRAM_QUEUE, type SendNotificationJob } from './notifications.service.js';

@Processor(TELEGRAM_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(NotificationLog) private readonly logsRepo: Repository<NotificationLog>,
    private readonly botConfig: TelegramBotConfigService,
    private readonly telegramApi: TelegramApiService,
  ) {
    super();
  }

  async process(job: Job<SendNotificationJob>): Promise<void> {
    const log = await this.logsRepo.findOne({ where: { id: job.data.logId } });
    if (!log || !log.recipientChatId) return;

    const token = await this.botConfig.getToken();
    if (!token) {
      await this.markFailed(log, 'No bot token configured');
      return;
    }

    const result = await this.telegramApi.sendMessage(token, log.recipientChatId, log.message);
    if (result.ok) {
      log.status = NotificationStatus.SENT;
      log.sentAt = new Date();
      await this.logsRepo.save(log);
    } else {
      await this.markFailed(log, result.description ?? 'Unknown error');
    }
  }

  private async markFailed(log: NotificationLog, errorMessage: string): Promise<void> {
    log.status = NotificationStatus.FAILED;
    log.errorMessage = errorMessage;
    await this.logsRepo.save(log);
  }
}
