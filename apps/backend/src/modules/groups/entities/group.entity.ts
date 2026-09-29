import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// Mirrors Course.category — used for filtering (design's "IT · 4 / English ·
// 2" segmented control) — NOT a foreign key to a specific Course. Groups and
// the public catalog stay independent (confirmed decision).
export enum GroupCategory {
  IT = 'IT',
  ENGLISH = 'ENGLISH',
}

// Internal-only: no link to catalog `Course` (confirmed decision — groups and
// the public catalog stay independent). Group classes only, per TT §1.4: no
// one-to-one lessons.
@Entity('groups')
export class Group extends AppBaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'enum', enum: GroupCategory })
  category!: GroupCategory;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacher_user_id' })
  teacher!: Relation<User>;

  @Column({ name: 'teacher_user_id' })
  teacherUserId!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
