import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { randomUUID } from 'node:crypto';

const PRESIGN_UPLOAD_EXPIRY_SECONDS = 60 * 60; // 1 hour — generous for a 5GB upload on a slow connection.
const PRESIGN_DOWNLOAD_EXPIRY_SECONDS = 15 * 60;

// Thin wrapper around the MinIO SDK (S3-compatible). Uploads and downloads
// go directly between the client and MinIO via presigned URLs — the Nest
// server never buffers file bytes, which is the only way "up to 5 GB per
// file" (TT §2.4) is workable without the API becoming the bottleneck. A
// single presigned PUT covers this: S3's own single-PUT limit is exactly
// 5GB, so no custom chunking protocol is needed for files at or under that.
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Client;

  public readonly bucketAvatars: string;
  public readonly bucketTaskFiles: string;
  public readonly bucketContent: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      endPoint: this.config.get<string>('minio.endpoint')!,
      port: this.config.get<number>('minio.port'),
      useSSL: this.config.get<boolean>('minio.useSSL'),
      accessKey: this.config.get<string>('minio.accessKey')!,
      secretKey: this.config.get<string>('minio.secretKey')!,
    });
    this.bucketAvatars = this.config.get<string>('minio.bucketAvatars')!;
    this.bucketTaskFiles = this.config.get<string>('minio.bucketTaskFiles')!;
    this.bucketContent = this.config.get<string>('minio.bucketContent')!;
  }

  async onModuleInit(): Promise<void> {
    // Avatars and content (news covers, etc.) are publicly viewable by
    // design; task attachments stay private, accessed only via
    // permission-checked presigned GET URLs scoped to the owning resource.
    await this.ensureBucket(this.bucketAvatars, true);
    await this.ensureBucket(this.bucketContent, true);
    await this.ensureBucket(this.bucketTaskFiles, false);
  }

  generateObjectKey(originalFilename: string): string {
    const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${randomUUID()}-${safeName}`;
  }

  presignedUploadUrl(bucket: string, objectKey: string): Promise<string> {
    return this.client.presignedPutObject(bucket, objectKey, PRESIGN_UPLOAD_EXPIRY_SECONDS);
  }

  presignedDownloadUrl(bucket: string, objectKey: string): Promise<string> {
    return this.client.presignedGetObject(bucket, objectKey, PRESIGN_DOWNLOAD_EXPIRY_SECONDS);
  }

  publicUrl(bucket: string, objectKey: string): string {
    const useSSL = this.config.get<boolean>('minio.useSSL');
    const endpoint = this.config.get<string>('minio.endpoint');
    const port = this.config.get<number>('minio.port');
    return `${useSSL ? 'https' : 'http'}://${endpoint}:${port}/${bucket}/${objectKey}`;
  }

  async removeObject(bucket: string, objectKey: string): Promise<void> {
    await this.client.removeObject(bucket, objectKey);
  }

  private async ensureBucket(bucket: string, publicRead: boolean): Promise<void> {
    try {
      const exists = await this.client.bucketExists(bucket);
      if (!exists) await this.client.makeBucket(bucket);

      if (publicRead) {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
      }
    } catch (err) {
      // Non-fatal at boot: object storage may not be reachable yet in some
      // deployments; file operations will surface the real error when used.
      this.logger.warn(`Could not ensure bucket "${bucket}": ${(err as Error).message}`);
    }
  }
}
