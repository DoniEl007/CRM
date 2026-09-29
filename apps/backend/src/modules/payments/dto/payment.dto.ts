import { IsEnum, IsISO8601, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentStatus } from '../entities/student-payment-status.entity.js';

export class RecordPaymentDto {
  @IsUUID()
  studentUserId!: string;

  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SetPaymentStatusDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
