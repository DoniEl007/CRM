import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';
import { NotificationType } from './notification-setting.entity.js';

export enum RecipientType {
  USER = 'USER',
  PARENT = 'PARENT',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('notification_logs')
export class NotificationLog extends AppBaseEntity {
  @Column({ type: 'enum', enum: RecipientType, name: 'recipient_type' })
  recipientType!: RecipientType;

  // Set for RecipientType.USER — the platform account being notified.
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recipient_user_id' })
  recipientUser?: Relation<User>;

  @Column({ name: 'recipient_user_id', nullable: true })
  recipientUserId?: string;

  // Set for RecipientType.PARENT — parents have no User account (TT §1.4),
  // so they're addressed directly by their linked Telegram chat_id.
  @Column({ name: 'recipient_chat_id', nullable: true })
  recipientChatId?: string;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.QUEUED })
  status!: NotificationStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;
}
