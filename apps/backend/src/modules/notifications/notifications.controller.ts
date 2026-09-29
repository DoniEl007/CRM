import { Body, Controller, ForbiddenException, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { UsersService } from '../identity/users/users.service.js';
import { TelegramBotConfigService } from './telegram-bot-config.service.js';
import { NotificationSettingsService } from './notification-settings.service.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationType } from './entities/notification-setting.entity.js';
import { SetBotTokenDto } from './dto/set-bot-token.dto.js';
import { SetNotificationSettingDto } from './dto/set-notification-setting.dto.js';

// Bot administration is Full Administrator only (TT §4: "Also the Telegram
// bot administrator"). Full Admin bypasses permission checks as always;
// 'system.telegram_manage' is ungranted to every other role by default.
@Controller('telegram')
export class NotificationsController {
  constructor(
    private readonly botConfig: TelegramBotConfigService,
    private readonly settings: NotificationSettingsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
  ) {}

  @Get('bot-config')
  @RequirePermission('system.telegram_manage')
  getBotConfig() {
    return this.botConfig.getMasked();
  }

  @Post('bot-config')
  @RequirePermission('system.telegram_manage')
  setBotConfig(@Body() dto: SetBotTokenDto) {
    return this.botConfig.setToken(dto.botToken);
  }

  @Post('bot-config/test')
  @RequirePermission('system.telegram_manage')
  testConnection() {
    return this.botConfig.testConnection();
  }

  @Post('bot-config/test-message')
  @RequirePermission('system.telegram_manage')
  sendTestMessage(@Body('chatId') chatId: string) {
    return this.botConfig.sendTestMessage(chatId);
  }

  @Get('settings')
  @RequirePermission('system.telegram_manage')
  listSettings() {
    return this.settings.listAll();
  }

  @Patch('settings/:type')
  @RequirePermission('system.telegram_manage')
  setSetting(@Param('type') type: NotificationType, @Body() dto: SetNotificationSettingDto) {
    return this.settings.setEnabled(type, dto.enabled);
  }

  @Get('logs')
  @RequirePermission('system.telegram_manage')
  listLogs() {
    return this.notificationsService.listRecent();
  }

  // Any authenticated user linking their own account (TT §3.11's "relevant
  // platform user" recipients).
  @Post('link/me')
  async linkMe(@CurrentUser() user: AuthenticatedUser) {
    const token = await this.usersService.generateOwnTelegramLinkToken(user.userId);
    const { botUsername } = await this.botConfig.getMasked();
    return { token, deepLink: botUsername ? `https://t.me/${botUsername}?start=${token}` : null };
  }

  // Parent linking (TT §6.1): reachable by staff managing the student's
  // account, or by the student themselves from their own profile.
  @Get('link/parent/:studentUserId')
  async getParentLinkStatus(@Param('studentUserId') studentUserId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.assertCanManageParentLink(studentUserId, user);
    const profile = await this.usersService.getStudentProfile(studentUserId);
    return {
      parentTelegramUsername: profile?.parentTelegramUsername ?? null,
      parentLinked: profile?.parentLinked ?? false,
    };
  }

  @Post('link/parent/:studentUserId/regenerate')
  async regenerateParentLink(
    @Param('studentUserId') studentUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.assertCanManageParentLink(studentUserId, user);
    const token = await this.usersService.generateParentLinkToken(studentUserId);
    const { botUsername } = await this.botConfig.getMasked();
    return { token, deepLink: botUsername ? `https://t.me/${botUsername}?start=${token}` : null };
  }

  private async assertCanManageParentLink(studentUserId: string, user: AuthenticatedUser): Promise<void> {
    if (user.userId === studentUserId) return;
    const canManage = await this.rbacService.isGranted(user.role, 'credentials.create');
    if (!canManage) throw new ForbiddenException('You cannot manage this student\'s parent link');
  }
}
