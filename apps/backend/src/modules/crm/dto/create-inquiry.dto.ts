import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

// Public contact-form submission (TT §3.1): "each inquiry is recorded
// automatically in the CRM as a new request."
export class CreateInquiryDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsUUID()
  courseInterestId?: string;
}
