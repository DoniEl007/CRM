import { IsEmail, IsIn, IsISO8601, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

const LOCALES = ['en', 'ru', 'uz-Latn', 'uz-Cyrl'] as const;

// Confirms/collects everything needed to turn a request into an active,
// paying student in one step (TT §6.2 login-by-email, plus the design's
// combined "New student & login" screen): the login itself, group
// enrollment, parent Telegram linking info, date of birth, and interface
// language. Only `email`/`firstName`/`lastName` are required — the rest can
// still be filled in later from the student's own profile.
export class ActivateRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  // If given, enrolls the new student into this group as part of activation
  // (capacity-checked the same way as a normal POST /groups/:id/members).
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsString()
  parentTelegramUsername?: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(LOCALES)
  preferredLocale?: (typeof LOCALES)[number];
}
