import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, type Relation } from 'typeorm';
import { Group } from './group.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// Many-to-many: a student may belong to multiple groups (e.g. one IT group +
// one English group) — confirmed decision. Max 10 members per group is
// enforced in GroupsService, not by a DB constraint.
@Entity('group_memberships')
@Unique(['groupId', 'studentUserId'])
export class GroupMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Relation<Group>;

  @Column({ name: 'group_id' })
  groupId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  student!: Relation<User>;

  @Column({ name: 'student_user_id' })
  studentUserId!: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt!: Date;
}
