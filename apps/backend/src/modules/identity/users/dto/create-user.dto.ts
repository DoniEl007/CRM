import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../../common/enums/role.enum.js';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsEnum(Role)
  role!: Role;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
