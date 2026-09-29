import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { UsersService } from '../identity/users/users.service.js';
import { MinioService } from './minio.service.js';
import { FilesService } from './files.service.js';
import { PresignUploadDto } from './dto/presign-upload.dto.js';
import { ConfirmAvatarDto } from './dto/confirm-avatar.dto.js';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
    private readonly minio: MinioService,
  ) {}

  // Client uploads the file bytes directly to the returned uploadUrl (a
  // presigned PUT) — never through this server — then uses objectKey/
  // publicUrl wherever the platform expects a file reference (avatarUrl,
  // Task.attachmentFileKey, Submission.fileKey, NewsPost.coverImageFileKey).
  @Post('presign-upload')
  presignUpload(@Body() dto: PresignUploadDto, @CurrentUser() user: AuthenticatedUser) {
    return this.filesService.presignUpload(dto.purpose, dto.filename, user);
  }

  // Confirms a completed avatar upload and sets it on the caller's own
  // account — always self, so no ownership check beyond authentication.
  @Post('avatar/confirm')
  async confirmAvatar(@Body() dto: ConfirmAvatarDto, @CurrentUser() user: AuthenticatedUser) {
    const avatarUrl = this.minio.publicUrl(this.minio.bucketAvatars, dto.objectKey);
    await this.usersService.updateAvatarUrl(user.userId, avatarUrl);
    return { avatarUrl };
  }
}
