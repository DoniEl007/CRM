import { IsEmail, IsString, MinLength } from 'class-validator';

// Confirms/collects the details needed to provision the new Student login
// (TT §6.2: login is the student's public email address) at the moment a
// request converts to an active, paying student.
export class ActivateRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;
}
