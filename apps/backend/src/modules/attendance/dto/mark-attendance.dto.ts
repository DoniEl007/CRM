import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsUUID, ValidateNested } from 'class-validator';

class AttendanceEntryDto {
  @IsUUID()
  studentUserId!: string;

  @IsBoolean()
  present!: boolean;
}

export class MarkAttendanceDto {
  @IsDateString()
  date!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  records!: AttendanceEntryDto[];
}
