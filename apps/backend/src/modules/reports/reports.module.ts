import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportExport } from './entities/report-export.entity.js';
import { User } from '../identity/entities/user.entity.js';
import { Group } from '../groups/entities/group.entity.js';
import { GroupMembership } from '../groups/entities/group-membership.entity.js';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity.js';
import { PaymentCycle } from '../payments/entities/payment-cycle.entity.js';
import { StudentPaymentStatus } from '../payments/entities/student-payment-status.entity.js';
import { Submission } from '../tasks/entities/submission.entity.js';
import { Task } from '../tasks/entities/task.entity.js';
import { Request as CrmRequest } from '../crm/entities/request.entity.js';
import { AnalyticsService } from './analytics.service.js';
import { ReportExcelBuilderService } from './report-excel-builder.service.js';
import { ReportsService, REPORTS_QUEUE } from './reports.service.js';
import { ReportsProcessor } from './reports.processor.js';
import { ReportsController } from './reports.controller.js';
import { RbacModule } from '../identity/rbac/rbac.module.js';
import { FilesModule } from '../files/files.module.js';

// A cross-cutting analytics/reporting module reads entities from several
// other modules directly (read-only aggregation queries) rather than going
// through each module's service — reasonable for a reporting layer in a
// single-database modular monolith.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportExport,
      User,
      Group,
      GroupMembership,
      AttendanceRecord,
      PaymentCycle,
      StudentPaymentStatus,
      Submission,
      Task,
      CrmRequest,
    ]),
    BullModule.registerQueue({ name: REPORTS_QUEUE }),
    RbacModule,
    FilesModule,
  ],
  providers: [AnalyticsService, ReportExcelBuilderService, ReportsService, ReportsProcessor],
  controllers: [ReportsController],
  exports: [AnalyticsService, ReportsService],
})
export class ReportsModule {}
