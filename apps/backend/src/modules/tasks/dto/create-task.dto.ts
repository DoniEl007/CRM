import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TaskType } from '../entities/task.entity.js';

class CreateTaskQuestionDto {
  @IsString()
  @MinLength(1)
  questionText!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  correctOptionIndex!: number;
}

export class CreateTaskDto {
  @IsUUID()
  groupId!: string;

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

  @IsOptional() @IsString() descriptionEn?: string;
  @IsOptional() @IsString() descriptionRu?: string;
  @IsOptional() @IsString() descriptionUzLatn?: string;
  @IsOptional() @IsString() descriptionUzCyrl?: string;

  @IsEnum(TaskType)
  type!: TaskType;

  @IsOptional()
  @IsString()
  attachmentFileKey?: string;

  // Required for MCQ/AUTO_TEST, ignored otherwise — validated further in
  // TasksService since class-validator can't easily cross-check against a
  // sibling enum value here.
  @ValidateIf((dto: CreateTaskDto) => dto.type === TaskType.MCQ || dto.type === TaskType.AUTO_TEST)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTaskQuestionDto)
  questions?: CreateTaskQuestionDto[];
}
