import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';

// Single-row config, same pattern as AboutPage. The bot token lives here
// (DB) rather than only in the environment, so Full Administrator — "the
// Telegram bot administrator" per TT §4 — can view (masked) and rotate it
// from an admin screen without a redeploy. TELEGRAM_BOT_TOKEN/_USERNAME env
// vars only seed this row on first boot if it's empty.
@Entity('telegram_bot_config')
export class TelegramBotConfig extends AppBaseEntity {
  @Column({ name: 'bot_token', nullable: true })
  botToken?: string;

  @Column({ name: 'bot_username', nullable: true })
  botUsername?: string;

  @Column({ name: 'is_connected', default: false })
  isConnected!: boolean;

  @Column({ name: 'last_checked_at', type: 'timestamptz', nullable: true })
  lastCheckedAt?: Date;
}
