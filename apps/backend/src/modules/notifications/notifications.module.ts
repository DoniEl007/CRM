import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotConfig } from './entities/telegram-bot-config.entity.js';
import { NotificationSetting } from './entities/notification-setting.entity.js';
import { NotificationLog } from './entities/notification-log.entity.js';
import { ScheduleSlot } from '../groups/entities/schedule-slot.entity.js';
import { TelegramApiService } from './telegram-api.service.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';
import { NotificationSettingsService } from './notification-settings.service.js';
import { NotificationsService, TELEGRAM_QUEUE } from './notifications.service.js';
import { NotificationsProcessor } from './notifications.processor.js';
import { NotificationsController } from './notifications.controller.js';
import { TelegramWebhookController } from './telegram-webhook.controller.js';
import { ClassReminderScannerService } from './class-reminder-scanner.service.js';
import { ClassReminderProcessor, CLASS_REMINDER_QUEUE } from './class-reminder.processor.js';
import { ClassReminderSchedulerBootstrap } from './class-reminder-scheduler.bootstrap.js';
import { UsersModule } from '../identity/users/users.module.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';
import { GroupsModule } from '../groups/groups.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelegramBotConfig, NotificationSetting, NotificationLog, ScheduleSlot]),
    BullModule.registerQueue({ name: TELEGRAM_QUEUE }, { name: CLASS_REMINDER_QUEUE }),
    UsersModule,
    RbacModule,
    GroupsModule,
  ],
  providers: [
    TelegramApiService,
    TelegramBotConfigService,
    NotificationSettingsService,
    NotificationsService,
    NotificationsProcessor,
    ClassReminderScannerService,
    ClassReminderProcessor,
    ClassReminderSchedulerBootstrap,
  ],
  controllers: [NotificationsController, TelegramWebhookController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
