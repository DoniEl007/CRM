import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Server, Socket } from 'socket.io';
import { Public } from '../../common/decorators/public.decorator.js';
import { ConversationParticipant } from './entities/conversation-participant.entity.js';
import type { Message } from './entities/message.entity.js';

const CONVERSATION_ROOM_PREFIX = 'conversation:';

// Real-time layer per TT §2.5. Messages are still persisted via the REST
// endpoints (ChatService); this gateway only authenticates sockets, manages
// per-conversation rooms, and broadcasts newly-persisted messages. Kept
// one-directional (ChatService -> ChatGateway) to avoid a circular
// dependency: the gateway never needs to call back into ChatService.
//
// @Public() exempts this class from the global JwtAuthGuard/PermissionsGuard
// (registered as APP_GUARD): those guards assume an HTTP request object
// (e.g. reading `req.headers.authorization`) and crash against a WS
// execution context. Authentication here is handled explicitly in
// handleConnection instead, against the socket handshake.
@Public()
@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(ConversationParticipant)
    private readonly participantsRepo: Repository<ConversationParticipant>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const isParticipant = await this.participantsRepo.exists({ where: { conversationId, userId } });
    if (!isParticipant) {
      client.emit('error', { message: 'Not a participant of this conversation' });
      return;
    }
    await client.join(`${CONVERSATION_ROOM_PREFIX}${conversationId}`);
  }

  broadcastNewMessage(conversationId: string, message: Message): void {
    this.server.to(`${CONVERSATION_ROOM_PREFIX}${conversationId}`).emit('message', message);
  }
}
