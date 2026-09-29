import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';

// TT §3.11's five trigger events. Absence goes to the student's parent;
// the other four go to the relevant platform user.
export enum NotificationType {
  PAYMENT_DUE = 'PAYMENT_DUE',
  NEW_ASSIGNMENT = 'NEW_ASSIGNMENT',
  GRADE_POSTED = 'GRADE_POSTED',
  CLASS_REMINDER = 'CLASS_REMINDER',
  ABSENCE = 'ABSENCE',
}

// One row per type, seeded enabled=true by default; Full Administrator can
// toggle each independently from the bot admin screen.
@Entity('notification_settings')
export class NotificationSetting extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ default: true })
  enabled!: boolean;
}
