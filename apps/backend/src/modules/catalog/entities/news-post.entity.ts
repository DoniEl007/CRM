import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { User } from '../../identity/entities/user.entity.js';

export enum NewsCategory {
  NEW_GROUP = 'NEW_GROUP',
  RESULTS = 'RESULTS',
  SCHEDULE = 'SCHEDULE',
  CENTER_NEWS = 'CENTER_NEWS',
  EVENTS = 'EVENTS',
}

export enum NewsStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

// News/blog section (TT §3.1).
@Entity('news_posts')
export class NewsPost extends AppBaseEntity {
  @Column({ name: 'title_en' })
  titleEn!: string;

  @Column({ name: 'title_ru' })
  titleRu!: string;

  @Column({ name: 'title_uz_latn' })
  titleUzLatn!: string;

  @Column({ name: 'title_uz_cyrl' })
  titleUzCyrl!: string;

  @Column({ name: 'body_en', type: 'text' })
  bodyEn!: string;

  @Column({ name: 'body_ru', type: 'text' })
  bodyRu!: string;

  @Column({ name: 'body_uz_latn', type: 'text' })
  bodyUzLatn!: string;

  @Column({ name: 'body_uz_cyrl', type: 'text' })
  bodyUzCyrl!: string;

  @Column({ name: 'cover_image_file_key', nullable: true })
  coverImageFileKey?: string;

  @Column({ type: 'enum', enum: NewsCategory })
  category!: NewsCategory;

  @Column({ type: 'enum', enum: NewsStatus, default: NewsStatus.DRAFT })
  status!: NewsStatus;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'author_user_id' })
  author?: Relation<User>;

  @Column({ name: 'author_user_id', nullable: true })
  authorUserId?: string;
}
