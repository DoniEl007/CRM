import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, type Relation } from 'typeorm';
import { Conversation } from './conversation.entity.js';
import { User } from '../../identity/entities/user.entity.js';

@Entity('conversation_participants')
@Unique(['conversationId', 'userId'])
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Relation<Conversation>;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ name: 'user_id' })
  userId!: string;

  // Drives unread counts: messages with sentAt > lastReadAt are unread.
  @Column({ name: 'last_read_at', type: 'timestamptz', nullable: true })
  lastReadAt?: Date;
}
