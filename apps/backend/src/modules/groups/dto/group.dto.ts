import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { GroupCategory } from '../entities/group.entity.js';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(GroupCategory)
  category!: GroupCategory;

  @IsUUID()
  teacherUserId!: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(GroupCategory)
  category?: GroupCategory;

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
