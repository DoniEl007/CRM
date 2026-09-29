import { IsBoolean, IsEnum, IsIn } from 'class-validator';
import { Role } from '../../../../common/enums/role.enum.js';
import { PERMISSION_KEYS, type PermissionKey } from '../../../../common/enums/permission-key.js';

export class SetGrantDto {
  @IsEnum(Role)
  role!: Role;

  @IsIn(PERMISSION_KEYS)
  permissionKey!: PermissionKey;

  @IsBoolean()
  granted!: boolean;
}
