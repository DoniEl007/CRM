import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { RbacService } from './rbac.service.js';
import { RbacController } from './rbac.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission])],
  providers: [RbacService],
  controllers: [RbacController],
  exports: [RbacService],
})
export class RbacModule {}
