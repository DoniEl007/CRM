import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GradeSubmissionDto {
  @IsInt()
  @Min(0)
  correctCount!: number;

  @IsInt()
  @Min(1)
  totalCount!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
