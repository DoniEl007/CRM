import { ForbiddenException, Injectable } from '@nestjs/common';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { MinioService } from './minio.service.js';
import type { UploadPurpose } from './dto/presign-upload.dto.js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';

export interface PresignedUpload {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string | null;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly minio: MinioService,
    private readonly rbacService: RbacService,
  ) {}

  async presignUpload(purpose: UploadPurpose, filename: string, user: AuthenticatedUser): Promise<PresignedUpload> {
    const bucket = await this.resolveBucketAndCheckAccess(purpose, user);
    const objectKey = this.minio.generateObjectKey(filename);
    const uploadUrl = await this.minio.presignedUploadUrl(bucket, objectKey);
    const isPublic = bucket !== this.minio.bucketTaskFiles;
    return { uploadUrl, objectKey, publicUrl: isPublic ? this.minio.publicUrl(bucket, objectKey) : null };
  }

  async presignTaskFileDownload(objectKey: string): Promise<string> {
    return this.minio.presignedDownloadUrl(this.minio.bucketTaskFiles, objectKey);
  }

  async presignReportDownload(objectKey: string): Promise<string> {
    return this.minio.presignedDownloadUrl(this.minio.bucketReports, objectKey);
  }

  async uploadReportFile(objectKey: string, buffer: Buffer): Promise<void> {
    await this.minio.uploadBuffer(
      this.minio.bucketReports,
      objectKey,
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  }

  private async resolveBucketAndCheckAccess(purpose: UploadPurpose, user: AuthenticatedUser): Promise<string> {
    switch (purpose) {
      case 'avatar':
        // Anyone can upload their own avatar.
        return this.minio.bucketAvatars;

      case 'task-attachment': {
        // Teachers attach instructions, students attach submissions — both
        // already permission-gated on the endpoints that consume the key
        // (POST /tasks, POST /tasks/:id/submit); this just mirrors that gate
        // so an unrelated role (e.g. CEO) can't even obtain an upload URL.
        const canManageTasks = await this.rbacService.isGranted(user.role, 'tasks.manage');
        const canSubmitTasks = await this.rbacService.isGranted(user.role, 'tasks.complete_own');
        if (!canManageTasks && !canSubmitTasks) {
          throw new ForbiddenException('You cannot upload task files');
        }
        return this.minio.bucketTaskFiles;
      }

      case 'content': {
        const canEditWebsite = await this.rbacService.isGranted(user.role, 'website.edit');
        if (!canEditWebsite) throw new ForbiddenException('You cannot upload website content');
        return this.minio.bucketContent;
      }
    }
  }
}
