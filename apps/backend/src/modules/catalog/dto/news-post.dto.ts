import { IsEnum, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';
import { NewsCategory, NewsStatus } from '../entities/news-post.entity.js';

export class CreateNewsPostDto {
  @IsString() @MinLength(1) titleEn!: string;
  @IsString() @MinLength(1) titleRu!: string;
  @IsString() @MinLength(1) titleUzLatn!: string;
  @IsString() @MinLength(1) titleUzCyrl!: string;

  @IsString() @MinLength(1) bodyEn!: string;
  @IsString() @MinLength(1) bodyRu!: string;
  @IsString() @MinLength(1) bodyUzLatn!: string;
  @IsString() @MinLength(1) bodyUzCyrl!: string;

  @IsOptional() @IsString() coverImageFileKey?: string;

  @IsEnum(NewsCategory)
  category!: NewsCategory;
}

export class UpdateNewsPostDto {
  @IsOptional() @IsString() @MinLength(1) titleEn?: string;
  @IsOptional() @IsString() @MinLength(1) titleRu?: string;
  @IsOptional() @IsString() @MinLength(1) titleUzLatn?: string;
  @IsOptional() @IsString() @MinLength(1) titleUzCyrl?: string;

  @IsOptional() @IsString() @MinLength(1) bodyEn?: string;
  @IsOptional() @IsString() @MinLength(1) bodyRu?: string;
  @IsOptional() @IsString() @MinLength(1) bodyUzLatn?: string;
  @IsOptional() @IsString() @MinLength(1) bodyUzCyrl?: string;

  @IsOptional() @IsString() coverImageFileKey?: string;
  @IsOptional() @IsEnum(NewsCategory) category?: NewsCategory;
}

export class PublishNewsPostDto {
  @IsEnum(NewsStatus)
  status!: NewsStatus;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}
