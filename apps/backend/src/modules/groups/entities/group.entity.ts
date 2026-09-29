import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// Internal-only: no link to catalog `Course` (confirmed decision — groups and
// the public catalog stay independent). Group classes only, per TT §1.4: no
// one-to-one lessons.
@Entity('groups')
export class Group extends AppBaseEntity {
  @Column()
  name!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacher_user_id' })
  teacher!: Relation<User>;

  @Column({ name: 'teacher_user_id' })
  teacherUserId!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
