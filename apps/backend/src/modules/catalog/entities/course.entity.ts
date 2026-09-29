import { Column, Entity } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';

export enum CourseCategory {
  IT = 'IT',
  ENGLISH = 'ENGLISH',
}

// Public catalog entry (TT §3.1). Intentionally has no relation to internal
// `Group` rows — confirmed decision: groups stay independent of the catalog.
@Entity('courses')
export class Course extends AppBaseEntity {
  @Column({ name: 'title_en' })
  titleEn!: string;

  @Column({ name: 'title_ru' })
  titleRu!: string;

  @Column({ name: 'title_uz_latn' })
  titleUzLatn!: string;

  @Column({ name: 'title_uz_cyrl' })
  titleUzCyrl!: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn?: string;

  @Column({ name: 'description_ru', type: 'text', nullable: true })
  descriptionRu?: string;

  @Column({ name: 'description_uz_latn', type: 'text', nullable: true })
  descriptionUzLatn?: string;

  @Column({ name: 'description_uz_cyrl', type: 'text', nullable: true })
  descriptionUzCyrl?: string;

  @Column({ type: 'enum', enum: CourseCategory })
  category!: CourseCategory;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  price?: string;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;
}
