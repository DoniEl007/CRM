import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramBotConfig } from './entities/telegram-bot-config.entity.js';
import { TelegramApiService } from './telegram-api.service.js';

@Injectable()
export class TelegramBotConfigService {
  constructor(
    @InjectRepository(TelegramBotConfig) private readonly configRepo: Repository<TelegramBotConfig>,
    private readonly telegramApi: TelegramApiService,
    private readonly config: ConfigService,
  ) {}

  // Seeds from TELEGRAM_BOT_TOKEN/_USERNAME on first boot only, if no row
  // exists yet — after that, the DB row (editable by Full Administrator) is
  // the source of truth.
  async getOrCreate(): Promise<TelegramBotConfig> {
    const existing = await this.configRepo.find({ take: 1 });
    if (existing.length > 0) return existing[0];

    return this.configRepo.save(
      this.configRepo.create({
        botToken: this.config.get<string>('telegram.botToken') || undefined,
        botUsername: this.config.get<string>('telegram.botUsername') || undefined,
      }),
    );
  }

  async getToken(): Promise<string | undefined> {
    const config = await this.getOrCreate();
    return config.botToken;
  }

  // Masks the token for API responses — Full Administrator can see it was
  // set and its last 4 characters, never the full value over the wire again.
  async getMasked(): Promise<{ botUsername?: string; isConnected: boolean; maskedToken: string | null }> {
    const config = await this.getOrCreate();
    return {
      botUsername: config.botUsername,
      isConnected: config.isConnected,
      maskedToken: config.botToken ? `••••${config.botToken.slice(-4)}` : null,
    };
  }

  async setToken(botToken: string): Promise<{ isConnected: boolean; botUsername?: string }> {
    const config = await this.getOrCreate();
    config.botToken = botToken;

    const result = await this.telegramApi.getMe(botToken);
    config.isConnected = result.ok;
    config.botUsername = result.result?.username ?? config.botUsername;
    config.lastCheckedAt = new Date();
    await this.configRepo.save(config);

    return { isConnected: config.isConnected, botUsername: config.botUsername };
  }

  async testConnection(): Promise<{ isConnected: boolean; description?: string }> {
    const config = await this.getOrCreate();
    if (!config.botToken) return { isConnected: false, description: 'No bot token configured' };

    const result = await this.telegramApi.getMe(config.botToken);
    config.isConnected = result.ok;
    config.lastCheckedAt = new Date();
    await this.configRepo.save(config);

    return { isConnected: result.ok, description: result.description };
  }

  async sendTestMessage(chatId: string): Promise<{ ok: boolean; description?: string }> {
    const token = await this.getToken();
    if (!token) return { ok: false, description: 'No bot token configured' };
    return this.telegramApi.sendMessage(token, chatId, 'This is a test message from the Helpdesk IT bot.');
  }
}
