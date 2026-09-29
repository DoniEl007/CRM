import { Module } from '@nestjs/common';
import { MinioService } from './minio.service.js';
import { FilesService } from './files.service.js';
import { FilesController } from './files.controller.js';
import { UsersModule } from '../identity/users/users.module.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';

@Module({
  imports: [UsersModule, RbacModule],
  providers: [MinioService, FilesService],
  controllers: [FilesController],
  exports: [MinioService, FilesService],
})
export class FilesModule {}
