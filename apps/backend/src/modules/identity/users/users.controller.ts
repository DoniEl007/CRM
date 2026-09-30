import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../../common/decorators/current-user.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermission('credentials.create')
  async create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: AuthenticatedUser) {
    const { user, temporaryPassword } = await this.usersService.createUser(dto, currentUser.role);
    // Returned once so staff can hand it to the new student/teacher; never
    // retrievable again since only the bcrypt hash is persisted.
    return { user: toPublicUser(user), temporaryPassword };
  }

  @Post(':id/reset-password')
  @RequirePermission('credentials.create')
  async resetPassword(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    const { user, temporaryPassword } = await this.usersService.regeneratePassword(id, currentUser.role);
    return { user: toPublicUser(user), temporaryPassword };
  }

  // Any authenticated user, regardless of role/permissions — every client
  // (this web app, both mobile apps) needs to restore who's logged in after
  // a reload from just the stored tokens, without a role-gated lookup.
  @Get('me')
  async findMe(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findById(currentUser.userId);
    return user ? toPublicUser(user) : null;
  }

  @Get()
  @RequirePermission('crm.manage')
  async findAll(@Query('role') role?: Role) {
    const users = await this.usersService.findAll(role);
    return users.map(toPublicUser);
  }

  @Get(':id')
  @RequirePermission('crm.manage')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return user ? toPublicUser(user) : null;
  }
}

function toPublicUser(user: {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  preferredLocale?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}) {
  const { id, email, role, firstName, lastName, phone, avatarUrl, preferredLocale, isActive, lastLoginAt } = user;
  return { id, email, role, firstName, lastName, phone, avatarUrl, preferredLocale, isActive, lastLoginAt };
}
