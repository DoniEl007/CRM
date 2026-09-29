import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity.js';
import { RequestsService } from './requests.service.js';
import { RequestsController } from './requests.controller.js';
import { PublicInquiriesController } from './public-inquiries.controller.js';
import { UsersModule } from '../identity/users/users.module.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';
import { GroupsModule } from '../groups/groups.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Request]), UsersModule, RbacModule, GroupsModule],
  providers: [RequestsService],
  controllers: [RequestsController, PublicInquiriesController],
  exports: [RequestsService],
})
export class CrmModule {}
