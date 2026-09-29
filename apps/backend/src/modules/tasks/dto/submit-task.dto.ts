import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

class McqAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsInt()
  @Min(0)
  selectedOptionIndex!: number;
}

// Exactly one of these should be populated depending on the task's type;
// enforced in TasksService against the task's actual type.
export class SubmitTaskDto {
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @IsOptional()
  @IsString()
  fileKey?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => McqAnswerDto)
  answers?: McqAnswerDto[];
}
