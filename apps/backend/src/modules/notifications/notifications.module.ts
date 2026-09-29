import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramBotConfig } from './entities/telegram-bot-config.entity.js';
import { NotificationSetting } from './entities/notification-setting.entity.js';
import { NotificationLog } from './entities/notification-log.entity.js';
import { TelegramApiService } from './telegram-api.service.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';
import { NotificationSettingsService } from './notification-settings.service.js';
import { NotificationsService, TELEGRAM_QUEUE } from './notifications.service.js';
import { NotificationsProcessor } from './notifications.processor.js';
import { NotificationsController } from './notifications.controller.js';
import { TelegramWebhookController } from './telegram-webhook.controller.js';
import { UsersModule } from '../identity/users/users.module.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelegramBotConfig, NotificationSetting, NotificationLog]),
    BullModule.registerQueue({ name: TELEGRAM_QUEUE }),
    UsersModule,
    RbacModule,
  ],
  providers: [
    TelegramApiService,
    TelegramBotConfigService,
    NotificationSettingsService,
    NotificationsService,
    NotificationsProcessor,
  ],
  controllers: [NotificationsController, TelegramWebhookController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
