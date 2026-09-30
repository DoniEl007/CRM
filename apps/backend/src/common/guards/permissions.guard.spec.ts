import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PermissionsGuard } from './permissions.guard.js';
import { RequirePermission } from '../decorators/require-permission.decorator.js';
import { Role } from '../enums/role.enum.js';

// Real decorator + real Reflector, not mocked: this is a regression test for
// a real shipped bug where the guard used reflector.get(key, handler) —
// which only reads handler-level metadata — so a @RequirePermission() put
// on the *controller class* (as RbacController and RequestsController do)
// was silently ignored and the route was left open to any authenticated
// user. Fixed by switching to getAllAndOverride([handler, class]).
@RequirePermission('crm.manage')
class ClassLevelController {
  handler() {}
}

class HandlerLevelController {
  @RequirePermission('tasks.manage')
  handler() {}
}

class NoDecoratorController {
  handler() {}
}

function makeContext(controllerClass: new (...args: any[]) => any, handlerName = 'handler', user?: object) {
  const handler = (controllerClass.prototype as any)[handlerName] ?? function () {};
  return {
    getHandler: () => handler,
    getClass: () => controllerClass,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

describe('PermissionsGuard', () => {
  let rbacService: { isGranted: ReturnType<typeof vi.fn> };
  let guard: PermissionsGuard;

  beforeEach(() => {
    rbacService = { isGranted: vi.fn(async () => true) };
    guard = new PermissionsGuard(new Reflector(), rbacService as any);
  });

  it('reads a permission key declared at the class level (regression test)', async () => {
    const context = makeContext(ClassLevelController, 'handler', { role: Role.ADMIN_STAFF });
    await guard.canActivate(context);
    expect(rbacService.isGranted).toHaveBeenCalledWith(Role.ADMIN_STAFF, 'crm.manage');
  });

  it('reads a permission key declared at the method level', async () => {
    const context = makeContext(HandlerLevelController, 'handler', { role: Role.TEACHER });
    await guard.canActivate(context);
    expect(rbacService.isGranted).toHaveBeenCalledWith(Role.TEACHER, 'tasks.manage');
  });

  it('allows the request through when no @RequirePermission is present at all', async () => {
    const context = makeContext(NoDecoratorController, 'handler', { role: Role.STUDENT });
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(rbacService.isGranted).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request when a permission is required', async () => {
    const context = makeContext(HandlerLevelController, 'handler', undefined);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('rejects when RbacService says the role lacks the permission', async () => {
    rbacService.isGranted.mockResolvedValue(false);
    const context = makeContext(HandlerLevelController, 'handler', { role: Role.STUDENT });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
