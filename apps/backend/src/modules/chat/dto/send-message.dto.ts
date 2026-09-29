import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

// At least one of text/attachmentFileKey must be present — checked in the
// service, since class-validator handles single-field rules more cleanly
// than "at least one of these two" cross-field rules.
export class SendMessageDto {
  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => value !== undefined)
  @MinLength(1)
  text?: string;

  @IsOptional()
  @IsString()
  attachmentFileKey?: string;
}
