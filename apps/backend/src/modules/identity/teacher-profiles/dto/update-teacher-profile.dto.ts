import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTeacherProfileDto {
  @IsOptional() @IsString() titleEn?: string;
  @IsOptional() @IsString() titleRu?: string;
  @IsOptional() @IsString() titleUzLatn?: string;
  @IsOptional() @IsString() titleUzCyrl?: string;

  @IsOptional() @IsString() bioEn?: string;
  @IsOptional() @IsString() bioRu?: string;
  @IsOptional() @IsString() bioUzLatn?: string;
  @IsOptional() @IsString() bioUzCyrl?: string;

  @IsOptional() @IsString() publicPhotoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teachingLanguages?: string[];

  @IsOptional() @IsBoolean() isPublished?: boolean;
}
