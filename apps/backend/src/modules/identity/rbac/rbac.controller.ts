import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator.js';
import { RbacService } from './rbac.service.js';
import { SetGrantDto } from './dto/set-grant.dto.js';

// Full Administrator's RBAC configuration screen (TT §4.1 note: the access
// matrix is editable, not fixed in code). Full Administrator always bypasses
// permission checks (see RbacService.isGranted), so gating this controller
// behind 'system.rbac_manage' still leaves Full Admin able to reach it.
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('matrix')
  @RequirePermission('system.rbac_manage')
  getMatrix() {
    return this.rbacService.getMatrix();
  }

  @Post('grant')
  @RequirePermission('system.rbac_manage')
  async setGrant(@Body() dto: SetGrantDto) {
    await this.rbacService.setGrant(dto.role, dto.permissionKey, dto.granted);
    return { ok: true };
  }
}
