import { IsISO8601 } from 'class-validator';

export class ScheduleTrialDto {
  @IsISO8601()
  trialLessonAt!: string;
}
