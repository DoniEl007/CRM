import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity.js';
import { ConversationParticipant } from './entities/conversation-participant.entity.js';
import { Message } from './entities/message.entity.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { ChatGateway } from './chat.gateway.js';

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  linkedGroupId?: string;
  lastMessage: Message | null;
  unreadCount: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantsRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message) private readonly messagesRepo: Repository<Message>,
    private readonly chatGateway: ChatGateway,
  ) {}

  // --- Group conversation lifecycle, called from GroupsService ---

  async createGroupConversation(groupId: string, initialUserIds: string[]): Promise<Conversation> {
    const conversation = await this.conversationsRepo.save(
      this.conversationsRepo.create({ type: ConversationType.GROUP, linkedGroupId: groupId }),
    );
    await this.participantsRepo.save(
      initialUserIds.map((userId) => this.participantsRepo.create({ conversationId: conversation.id, userId })),
    );
    return conversation;
  }

  async addParticipantToGroupChat(groupId: string, userId: string): Promise<void> {
    const conversation = await this.conversationsRepo.findOne({ where: { linkedGroupId: groupId } });
    if (!conversation) return; // Group predates chat, or chat creation failed — non-fatal.

    const exists = await this.participantsRepo.exists({ where: { conversationId: conversation.id, userId } });
    if (!exists) {
      await this.participantsRepo.save(this.participantsRepo.create({ conversationId: conversation.id, userId }));
    }
  }

  async removeParticipantFromGroupChat(groupId: string, userId: string): Promise<void> {
    const conversation = await this.conversationsRepo.findOne({ where: { linkedGroupId: groupId } });
    if (!conversation) return;
    await this.participantsRepo.delete({ conversationId: conversation.id, userId });
  }

  // --- Direct conversations ---

  async getOrCreateDirectConversation(userIdA: string, userIdB: string): Promise<Conversation> {
    if (userIdA === userIdB) throw new BadRequestException('Cannot start a conversation with yourself');

    const candidates = await this.participantsRepo
      .createQueryBuilder('p')
      .innerJoin(
        Conversation,
        'c',
        'c.id = p.conversation_id AND c.type = :type',
        { type: ConversationType.DIRECT },
      )
      .where('p.user_id IN (:...ids)', { ids: [userIdA, userIdB] })
      .groupBy('p.conversation_id')
      .having('COUNT(DISTINCT p.user_id) = 2')
      .select('p.conversation_id', 'conversationId')
      .getRawMany<{ conversationId: string }>();

    if (candidates.length > 0) {
      return this.conversationsRepo.findOneByOrFail({ id: candidates[0].conversationId });
    }

    const conversation = await this.conversationsRepo.save(
      this.conversationsRepo.create({ type: ConversationType.DIRECT }),
    );
    await this.participantsRepo.save([
      this.participantsRepo.create({ conversationId: conversation.id, userId: userIdA }),
      this.participantsRepo.create({ conversationId: conversation.id, userId: userIdB }),
    ]);
    return conversation;
  }

  // --- Messaging ---

  async listConversationsForUser(userId: string): Promise<ConversationSummary[]> {
    const memberships = await this.participantsRepo.find({
      where: { userId },
      relations: { conversation: true },
    });

    return Promise.all(
      memberships.map(async (m): Promise<ConversationSummary> => {
        const lastMessage = await this.messagesRepo.findOne({
          where: { conversationId: m.conversationId },
          order: { sentAt: 'DESC' },
        });
        const unreadCount = await this.messagesRepo
          .createQueryBuilder('message')
          .where('message.conversation_id = :conversationId', { conversationId: m.conversationId })
          .andWhere(m.lastReadAt ? 'message.sent_at > :lastReadAt' : '1=1', { lastReadAt: m.lastReadAt })
          .getCount();

        return {
          id: m.conversationId,
          type: m.conversation.type,
          linkedGroupId: m.conversation.linkedGroupId,
          lastMessage,
          unreadCount,
        };
      }),
    );
  }

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    await this.assertIsParticipant(conversationId, userId);
    return this.messagesRepo.find({
      where: { conversationId },
      relations: { sender: true },
      order: { sentAt: 'ASC' },
    });
  }

  async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto): Promise<Message> {
    await this.assertIsParticipant(conversationId, senderId);
    if (!dto.text && !dto.attachmentFileKey) {
      throw new BadRequestException('A message needs text or an attachment');
    }

    const message = await this.messagesRepo.save(
      this.messagesRepo.create({
        conversationId,
        senderId,
        text: dto.text,
        attachmentFileKey: dto.attachmentFileKey,
        sentAt: new Date(),
      }),
    );

    this.chatGateway.broadcastNewMessage(conversationId, message);
    return message;
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    const participant = await this.assertIsParticipant(conversationId, userId);
    participant.lastReadAt = new Date();
    await this.participantsRepo.save(participant);
  }

  private async assertIsParticipant(conversationId: string, userId: string): Promise<ConversationParticipant> {
    const participant = await this.participantsRepo.findOne({ where: { conversationId, userId } });
    if (!participant) throw new ForbiddenException('You are not a participant of this conversation');
    return participant;
  }
}
