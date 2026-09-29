import { IsOptional, IsString } from 'class-validator';

export class UpdateAboutPageDto {
  @IsOptional() @IsString() bodyEn?: string;
  @IsOptional() @IsString() bodyRu?: string;
  @IsOptional() @IsString() bodyUzLatn?: string;
  @IsOptional() @IsString() bodyUzCyrl?: string;
}
