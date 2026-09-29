import { Body, Controller, ForbiddenException, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { PaymentsService } from './payments.service.js';
import { RecordPaymentDto, SetPaymentStatusDto } from './dto/payment.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly rbacService: RbacService,
  ) {}

  @Post()
  @RequirePermission('payments.manage')
  record(@Body() dto: RecordPaymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.recordPayment(dto, user.userId);
  }

  @Get('students/:studentUserId')
  @RequirePermission('payments.manage')
  listForStudent(@Param('studentUserId') studentUserId: string) {
    return this.paymentsService.listForStudent(studentUserId);
  }

  @Get('students/:studentUserId/status')
  @RequirePermission('payments.manage')
  getStatus(@Param('studentUserId') studentUserId: string) {
    return this.paymentsService.getStatus(studentUserId);
  }

  @Patch('students/:studentUserId/status')
  @RequirePermission('payments.manage')
  setStatus(
    @Param('studentUserId') studentUserId: string,
    @Body() dto: SetPaymentStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.setStatus(studentUserId, dto, user.userId);
  }

  @Get('me')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    const hasViewOwn = await this.rbacService.isGranted(user.role, 'payments.view_own');
    if (!hasViewOwn) throw new ForbiddenException('Missing permission: payments.view_own');
    const [payments, status] = await Promise.all([
      this.paymentsService.listForStudent(user.userId),
      this.paymentsService.getStatus(user.userId),
    ]);
    return { payments, status };
  }

  // CEO has read-only financial access (TT §4.1: "Read (fin.)"); Full
  // Administrator and Administrative Staff reach this via payments.manage.
  @Get('analytics')
  async getAnalytics(@CurrentUser() user: AuthenticatedUser) {
    const [canManage, canReadFinancial] = await Promise.all([
      this.rbacService.isGranted(user.role, 'payments.manage'),
      this.rbacService.isGranted(user.role, 'payments.read_financial'),
    ]);
    if (!canManage && !canReadFinancial) {
      throw new ForbiddenException('Missing permission: payments.manage or payments.read_financial');
    }
    return this.paymentsService.getAnalytics();
  }
}
