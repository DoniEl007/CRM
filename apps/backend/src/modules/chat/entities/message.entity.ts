import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Conversation } from './conversation.entity.js';
import { User } from '../../identity/entities/user.entity.js';

@Entity('messages')
export class Message extends AppBaseEntity {
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Relation<Conversation>;

  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender!: Relation<User>;

  @Column({ name: 'sender_id' })
  senderId!: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  // Object-storage key (MinIO) for an attached file, Telegram-style.
  @Column({ name: 'attachment_file_key', nullable: true })
  attachmentFileKey?: string;

  @Column({ name: 'sent_at', type: 'timestamptz' })
  sentAt!: Date;
}
