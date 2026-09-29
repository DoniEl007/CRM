import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

// Staff-entered request, e.g. a walk-in or phone inquiry (TT §3.2).
export class CreateManualRequestDto {
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
  @IsUUID()
  courseInterestId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
