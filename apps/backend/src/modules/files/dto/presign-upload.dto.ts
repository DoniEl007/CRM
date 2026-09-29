import { IsIn, IsString, MinLength } from 'class-validator';

// A fixed whitelist, not an arbitrary bucket name, so a client can never
// direct an upload at storage it shouldn't touch.
export const UPLOAD_PURPOSES = ['avatar', 'task-attachment', 'content'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export class PresignUploadDto {
  @IsIn(UPLOAD_PURPOSES)
  purpose!: UploadPurpose;

  @IsString()
  @MinLength(1)
  filename!: string;
}
