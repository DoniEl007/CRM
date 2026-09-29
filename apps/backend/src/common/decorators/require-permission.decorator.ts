import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../enums/permission-key.js';

export const PERMISSION_KEY_METADATA = 'permission_key';

export const RequirePermission = (key: PermissionKey) => SetMetadata(PERMISSION_KEY_METADATA, key);
