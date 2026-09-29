import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { StartDirectConversationDto } from './dto/start-direct-conversation.dto.js';

// TT §4.1: chat.access is granted to Teacher and Student only (Full Admin
// bypasses as always); Administrative Staff and CEO have no chat access.
@Controller('chat')
@RequirePermission('chat.access')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listConversationsForUser(user.userId);
  }

  @Post('conversations/direct')
  startDirect(@Body() dto: StartDirectConversationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getOrCreateDirectConversation(user.userId, dto.otherUserId);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getMessages(id, user.userId);
  }

  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.sendMessage(id, user.userId, dto);
  }

  @Post('conversations/:id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.chatService.markRead(id, user.userId);
  }
}
