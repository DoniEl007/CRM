import { Column, Entity, Index } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import type { PermissionKey } from '../../../common/enums/permission-key.js';

@Entity('permissions')
export class Permission extends AppBaseEntity {
  @Index({ unique: true })
  @Column()
  key!: PermissionKey;

  @Column()
  description!: string;
}
