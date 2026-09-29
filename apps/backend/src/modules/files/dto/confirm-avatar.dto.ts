import { IsString, MinLength } from 'class-validator';

export class ConfirmAvatarDto {
  @IsString()
  @MinLength(1)
  objectKey!: string;
}
