import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsUUID()
  teacherUserId!: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsUUID()
  teacherUserId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddMemberDto {
  @IsUUID()
  studentUserId!: string;
}
