import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Role } from '../enums/role.enum.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as AuthenticatedUser;
});
