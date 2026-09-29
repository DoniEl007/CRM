import { Injectable, CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../../modules/identity/rbac/rbac.service.js';
import { PERMISSION_KEY_METADATA } from '../decorators/require-permission.decorator.js';
import type { PermissionKey } from '../enums/permission-key.js';
import type { AuthenticatedUser } from '../decorators/current-user.decorator.js';

// Runs after JwtAuthGuard (see how it's applied in each controller): reads
// the @RequirePermission() key off the route handler and checks it against
// the requesting user's role via RbacService, which enforces TT §4.1's
// configurable per-role grant matrix.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredKey = this.reflector.getAllAndOverride<PermissionKey | undefined>(PERMISSION_KEY_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredKey) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException('Not authenticated');

    const granted = await this.rbacService.isGranted(user.role, requiredKey);
    if (!granted) throw new ForbiddenException(`Missing permission: ${requiredKey}`);
    return true;
  }
}
