import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { REDIS_CLIENT } from '../../../redis/redis.module.js';
import { Role } from '../../../common/enums/role.enum.js';
import { PERMISSION_KEYS, type PermissionKey } from '../../../common/enums/permission-key.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';

const CACHE_PREFIX = 'rbac:role-permissions:';
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Permission) private readonly permissionsRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepo: Repository<RolePermission>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // Full Administrator always has every permission: TT §4 defines it as
  // "Total system administrator with all privileges", and that must never
  // become reconfigurable away via the RBAC admin screen.
  async isGranted(role: Role, key: PermissionKey): Promise<boolean> {
    if (role === Role.FULL_ADMIN) return true;
    const granted = await this.getGrantedKeysForRole(role);
    return granted.has(key);
  }

  async getGrantedKeysForRole(role: Role): Promise<Set<PermissionKey>> {
    const cacheKey = `${CACHE_PREFIX}${role}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return new Set(JSON.parse(cached) as PermissionKey[]);
    }

    const rows = await this.rolePermissionsRepo.find({
      where: { role, granted: true },
      relations: { permission: true },
    });
    const keys = rows.map((row) => row.permission.key);
    await this.redis.set(cacheKey, JSON.stringify(keys), 'EX', CACHE_TTL_SECONDS);
    return new Set(keys);
  }

  async setGrant(role: Role, key: PermissionKey, granted: boolean): Promise<void> {
    const permission = await this.permissionsRepo.findOneByOrFail({ key });
    const existing = await this.rolePermissionsRepo.findOne({
      where: { role, permissionId: permission.id },
    });
    if (existing) {
      existing.granted = granted;
      await this.rolePermissionsRepo.save(existing);
    } else {
      await this.rolePermissionsRepo.save(
        this.rolePermissionsRepo.create({ role, permissionId: permission.id, granted }),
      );
    }
    await this.redis.del(`${CACHE_PREFIX}${role}`);
  }

  // Full matrix for the RBAC admin screen (Full Administrator only).
  async getMatrix(): Promise<Record<Role, Record<PermissionKey, boolean>>> {
    const rolePermissions = await this.rolePermissionsRepo.find({ relations: { permission: true } });

    const matrix = {} as Record<Role, Record<PermissionKey, boolean>>;
    for (const role of Object.values(Role)) {
      matrix[role] = {} as Record<PermissionKey, boolean>;
      for (const key of PERMISSION_KEYS) {
        matrix[role][key] = role === Role.FULL_ADMIN;
      }
    }
    for (const rp of rolePermissions) {
      matrix[rp.role][rp.permission.key] = rp.granted;
    }
    return matrix;
  }
}
