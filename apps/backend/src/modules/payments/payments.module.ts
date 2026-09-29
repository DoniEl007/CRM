import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentCycle } from './entities/payment-cycle.entity.js';
import { StudentPaymentStatus } from './entities/student-payment-status.entity.js';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentCycle, StudentPaymentStatus]), RbacModule],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
