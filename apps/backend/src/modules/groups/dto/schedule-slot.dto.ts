import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { DayOfWeek } from '../entities/schedule-slot.entity.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateScheduleSlotDto {
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @Matches(TIME_PATTERN, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @Matches(TIME_PATTERN, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsString()
  room?: string;
}
