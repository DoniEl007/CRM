import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationSetting, NotificationType } from './entities/notification-setting.entity.js';

@Injectable()
export class NotificationSettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(NotificationSetting) private readonly settingsRepo: Repository<NotificationSetting>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const type of Object.values(NotificationType)) {
      const exists = await this.settingsRepo.findOne({ where: { type } });
      if (!exists) await this.settingsRepo.save(this.settingsRepo.create({ type, enabled: true }));
    }
  }

  listAll(): Promise<NotificationSetting[]> {
    return this.settingsRepo.find({ order: { type: 'ASC' } });
  }

  async isEnabled(type: NotificationType): Promise<boolean> {
    const setting = await this.settingsRepo.findOne({ where: { type } });
    return setting?.enabled ?? true;
  }

  async setEnabled(type: NotificationType, enabled: boolean): Promise<NotificationSetting> {
    let setting = await this.settingsRepo.findOne({ where: { type } });
    if (!setting) setting = this.settingsRepo.create({ type });
    setting.enabled = enabled;
    return this.settingsRepo.save(setting);
  }
}
