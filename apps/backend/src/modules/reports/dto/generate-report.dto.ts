import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { ReportPeriod, ReportType } from '../entities/report-export.entity.js';

export class GenerateReportDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsEnum(ReportPeriod)
  period!: ReportPeriod;

  @IsISO8601()
  startDate!: string;

  @IsISO8601()
  endDate!: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;
}
