import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { PERMISSION_KEYS } from '../../../common/enums/permission-key.js';
import { Role } from '../../../common/enums/role.enum.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { User } from '../entities/user.entity.js';
import { DEFAULT_ROLE_GRANTS } from './default-role-grants.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class IdentitySeedService implements OnModuleInit {
  private readonly logger = new Logger(IdentitySeedService.name);

  constructor(
    @InjectRepository(Permission) private readonly permissionsRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermissionsRepo: Repository<RolePermission>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPermissionCatalog();
    await this.seedDefaultGrants();
    await this.seedBootstrapAdmin();
  }

  private async seedPermissionCatalog(): Promise<void> {
    for (const key of PERMISSION_KEYS) {
      const exists = await this.permissionsRepo.findOne({ where: { key } });
      if (!exists) {
        await this.permissionsRepo.save(this.permissionsRepo.create({ key, description: key }));
      }
    }
  }

  private async seedDefaultGrants(): Promise<void> {
    for (const { role, key } of DEFAULT_ROLE_GRANTS) {
      const permission = await this.permissionsRepo.findOneByOrFail({ key });
      const exists = await this.rolePermissionsRepo.findOne({
        where: { role, permissionId: permission.id },
      });
      if (!exists) {
        await this.rolePermissionsRepo.save(
          this.rolePermissionsRepo.create({ role, permissionId: permission.id, granted: true }),
        );
      }
    }
  }

  // Only runs when no user exists yet, and only if bootstrap credentials are
  // configured — otherwise there would be no way to log in and configure the
  // system on a fresh install (TT §8.2: installed on the Client's own server).
  private async seedBootstrapAdmin(): Promise<void> {
    const email = this.config.get<string>('bootstrapAdmin.email');
    const password = this.config.get<string>('bootstrapAdmin.password');
    if (!email || !password) return;

    const anyUser = await this.usersRepo.findOne({ where: {} });
    if (anyUser) return;

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.usersRepo.save(
      this.usersRepo.create({
        email,
        passwordHash,
        role: Role.FULL_ADMIN,
        firstName: 'Full',
        lastName: 'Administrator',
      }),
    );
    this.logger.warn(`Bootstrap Full Administrator account created for ${email}`);
  }
}
