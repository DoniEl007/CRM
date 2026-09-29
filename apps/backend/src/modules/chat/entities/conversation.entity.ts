import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Group } from '../../groups/entities/group.entity.js';

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

// GROUP conversations are 1:1 with a Group, kept in sync automatically by
// GroupsService (created alongside the group, membership mirrored on
// add/remove). DIRECT conversations are created on demand between two users.
@Entity('conversations')
export class Conversation extends AppBaseEntity {
  @Column({ type: 'enum', enum: ConversationType })
  type!: ConversationType;

  @ManyToOne(() => Group, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'linked_group_id' })
  linkedGroup?: Relation<Group>;

  @Column({ name: 'linked_group_id', nullable: true })
  linkedGroupId?: string;
}
