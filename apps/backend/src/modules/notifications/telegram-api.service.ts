import { Injectable, Logger } from '@nestjs/common';

export interface TelegramGetMeResult {
  ok: boolean;
  result?: { id: number; username: string; first_name: string };
  description?: string;
}

export interface TelegramSendMessageResult {
  ok: boolean;
  description?: string;
}

// Thin wrapper over the plain Telegram Bot API (https://core.telegram.org/bots/api)
// using native fetch — no bot framework needed for the handful of calls this
// platform makes (sendMessage, getMe, setWebhook).
@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);

  private baseUrl(token: string): string {
    return `https://api.telegram.org/bot${token}`;
  }

  async getMe(token: string): Promise<TelegramGetMeResult> {
    try {
      const res = await fetch(`${this.baseUrl(token)}/getMe`);
      return (await res.json()) as TelegramGetMeResult;
    } catch (err) {
      this.logger.warn(`getMe failed: ${(err as Error).message}`);
      return { ok: false, description: (err as Error).message };
    }
  }

  async sendMessage(token: string, chatId: string, text: string): Promise<TelegramSendMessageResult> {
    try {
      const res = await fetch(`${this.baseUrl(token)}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return (await res.json()) as TelegramSendMessageResult;
    } catch (err) {
      this.logger.warn(`sendMessage failed: ${(err as Error).message}`);
      return { ok: false, description: (err as Error).message };
    }
  }

  async setWebhook(token: string, url: string): Promise<TelegramSendMessageResult> {
    try {
      const res = await fetch(`${this.baseUrl(token)}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return (await res.json()) as TelegramSendMessageResult;
    } catch (err) {
      this.logger.warn(`setWebhook failed: ${(err as Error).message}`);
      return { ok: false, description: (err as Error).message };
    }
  }
}
