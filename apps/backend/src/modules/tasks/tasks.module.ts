import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity.js';
import { TaskQuestion } from './entities/task-question.entity.js';
import { Submission } from './entities/submission.entity.js';
import { TasksService } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { GroupsModule } from '../groups/groups.module.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { FilesModule } from '../files/files.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskQuestion, Submission]),
    GroupsModule,
    RbacModule,
    NotificationsModule,
    FilesModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
