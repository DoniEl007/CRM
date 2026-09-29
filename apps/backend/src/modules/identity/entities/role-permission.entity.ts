import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Permission } from './permission.entity.js';

// Grant matrix editable by Full Administrator (TT §4.1 note: RBAC is
// configurable, not hardcoded). Seeded from the TT's default matrix; a
// missing row for a (role, permission) pair is treated as not granted.
@Entity('role_permissions')
@Unique(['role', 'permissionId'])
export class RolePermission extends AppBaseEntity {
  @Index()
  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;

  @Column({ name: 'permission_id' })
  permissionId!: string;

  @Column({ default: true })
  granted!: boolean;
}
