import { IsBoolean, IsEnum, IsNumberString, IsOptional, IsString, MinLength } from 'class-validator';
import { CourseCategory } from '../entities/course.entity.js';

export class CreateCourseDto {
  @IsString()
  @MinLength(1)
  titleEn!: string;

  @IsString()
  @MinLength(1)
  titleRu!: string;

  @IsString()
  @MinLength(1)
  titleUzLatn!: string;

  @IsString()
  @MinLength(1)
  titleUzCyrl!: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @IsOptional()
  @IsString()
  descriptionUzLatn?: string;

  @IsOptional()
  @IsString()
  descriptionUzCyrl?: string;

  @IsEnum(CourseCategory)
  category!: CourseCategory;

  @IsOptional()
  @IsNumberString()
  price?: string;
}

export class UpdateCourseDto {
  @IsOptional() @IsString() @MinLength(1) titleEn?: string;
  @IsOptional() @IsString() @MinLength(1) titleRu?: string;
  @IsOptional() @IsString() @MinLength(1) titleUzLatn?: string;
  @IsOptional() @IsString() @MinLength(1) titleUzCyrl?: string;
  @IsOptional() @IsString() descriptionEn?: string;
  @IsOptional() @IsString() descriptionRu?: string;
  @IsOptional() @IsString() descriptionUzLatn?: string;
  @IsOptional() @IsString() descriptionUzCyrl?: string;
  @IsOptional() @IsEnum(CourseCategory) category?: CourseCategory;
  @IsOptional() @IsNumberString() price?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
