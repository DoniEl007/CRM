import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { RbacModule } from './rbac/rbac.module.js';
import { TeacherProfilesModule } from './teacher-profiles/teacher-profiles.module.js';
import { Permission } from './entities/permission.entity.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { User } from './entities/user.entity.js';
import { IdentitySeedService } from './seed/identity-seed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, RolePermission, User]),
    AuthModule,
    UsersModule,
    RbacModule,
    TeacherProfilesModule,
  ],
  providers: [IdentitySeedService],
  exports: [AuthModule, UsersModule, RbacModule, TeacherProfilesModule],
})
export class IdentityModule {}
