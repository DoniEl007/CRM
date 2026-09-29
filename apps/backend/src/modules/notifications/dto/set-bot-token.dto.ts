import { IsString, MinLength } from 'class-validator';

export class SetBotTokenDto {
  @IsString()
  @MinLength(10)
  botToken!: string;
}
