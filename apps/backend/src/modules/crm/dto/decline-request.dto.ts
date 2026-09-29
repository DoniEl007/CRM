import { IsString, MinLength } from 'class-validator';

export class DeclineRequestDto {
  @IsString()
  @MinLength(1)
  declineReason!: string;
}
