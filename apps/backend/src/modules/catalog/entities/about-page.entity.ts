import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';

// Single-row content for the editable "About the Learning Center" page
// (TT §3.1). AboutPageService always operates on the one existing row,
// creating it on first read if missing.
@Entity('about_page')
export class AboutPage extends AppBaseEntity {
  @Column({ name: 'body_en', type: 'text', default: '' })
  bodyEn!: string;

  @Column({ name: 'body_ru', type: 'text', default: '' })
  bodyRu!: string;

  @Column({ name: 'body_uz_latn', type: 'text', default: '' })
  bodyUzLatn!: string;

  @Column({ name: 'body_uz_cyrl', type: 'text', default: '' })
  bodyUzCyrl!: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy?: Relation<User>;

  @Column({ name: 'updated_by_user_id', nullable: true })
  updatedByUserId?: string;
}
