import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { UsersService } from '../identity/users/users.service.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';
import { TelegramApiService } from './telegram-api.service.js';

interface TelegramUpdate {
  message?: {
    text?: string;
    chat: { id: number | string };
    from?: { username?: string };
  };
}

// Public endpoint Telegram calls with every update (TT §6.1's one-time
// /start linking flow). Registered with Telegram via TelegramBotConfigService
// / setWebhook once the server has a public HTTPS URL (production only —
// Telegram requires a reachable HTTPS endpoint, so this can't be exercised
// against the real Telegram servers from an unreachable dev sandbox, only
// with simulated payloads).
@Controller('telegram')
export class TelegramWebhookController {
  constructor(
    private readonly usersService: UsersService,
    private readonly botConfig: TelegramBotConfigService,
    private readonly telegramApi: TelegramApiService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() update: TelegramUpdate): Promise<{ ok: true }> {
    const text = update.message?.text;
    if (!text?.startsWith('/start ')) return { ok: true };

    const token = text.slice('/start '.length).trim();
    const chatId = String(update.message!.chat.id);
    const telegramUsername = update.message?.from?.username;

    const studentProfile = await this.usersService.findStudentProfileByLinkToken(token);
    if (studentProfile) {
      await this.handleParentLink(studentProfile.userId, studentProfile.parentTelegramUsername, telegramUsername, chatId);
      return { ok: true };
    }

    const user = await this.usersService.findUserByTelegramLinkToken(token);
    if (user) {
      await this.usersService.linkOwnTelegramChat(user.id, chatId);
      await this.reply(chatId, 'Your Telegram is now linked to your Helpdesk IT account.');
      return { ok: true };
    }

    await this.reply(chatId, 'This link is invalid or has expired. Please ask the center for a new one.');
    return { ok: true };
  }

  private async handleParentLink(
    studentUserId: string,
    expectedUsername: string | undefined,
    actualUsername: string | undefined,
    chatId: string,
  ): Promise<void> {
    const normalize = (u?: string) => u?.replace(/^@/, '').toLowerCase();
    const mismatch =
      expectedUsername && actualUsername && normalize(expectedUsername) !== normalize(actualUsername);

    if (mismatch) {
      await this.reply(
        chatId,
        'This link was issued for a different Telegram username. Please contact the center for a new link.',
      );
      return;
    }

    await this.usersService.linkParentChat(studentUserId, chatId);
    await this.reply(chatId, 'You are now linked and will receive absence notifications from Helpdesk IT.');
  }

  private async reply(chatId: string, text: string): Promise<void> {
    const token = await this.botConfig.getToken();
    if (!token) return;
    await this.telegramApi.sendMessage(token, chatId, text);
  }
}
