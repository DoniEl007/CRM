import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity.js';
import { GroupMembership } from './entities/group-membership.entity.js';
import { ScheduleSlot } from './entities/schedule-slot.entity.js';
import { GroupsService } from './groups.service.js';
import { ScheduleSlotsService } from './schedule-slots.service.js';
import { GroupsController } from './groups.controller.js';
import { UsersModule } from '../identity/users/users.module.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';
import { ChatModule } from '../chat/chat.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMembership, ScheduleSlot]),
    UsersModule,
    RbacModule,
    ChatModule,
  ],
  providers: [GroupsService, ScheduleSlotsService],
  controllers: [GroupsController],
  exports: [GroupsService, ScheduleSlotsService],
})
export class GroupsModule {}
