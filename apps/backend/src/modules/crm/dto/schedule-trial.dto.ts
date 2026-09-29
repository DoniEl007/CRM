import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class ScheduleTrialDto {
  @IsISO8601()
  trialLessonAt!: string;

  // Which group the trial lesson is with — not a firm enrollment yet, just
  // pre-fills activation later (design shows it on the trial record).
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
