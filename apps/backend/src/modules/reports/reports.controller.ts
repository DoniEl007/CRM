import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { FilesService } from '../files/files.service.js';
import { ReportsService } from './reports.service.js';
import { AnalyticsService } from './analytics.service.js';
import { GenerateReportDto } from './dto/generate-report.dto.js';
import { ReportStatus, ReportType } from './entities/report-export.entity.js';

const FINANCIAL_REPORT_TYPES = new Set([ReportType.REVENUE, ReportType.OUTSTANDING_PAYMENTS]);

// TT §3.10 + the design's role lock: Revenue and Outstanding payments are
// reachable by CEO (reports.export_financial) as well as Full Admin;
// Enrollment, Attendance rates and Teacher/student performance are Full
// Administrator only (reports.export_all).
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly analyticsService: AnalyticsService,
    private readonly rbacService: RbacService,
    private readonly filesService: FilesService,
  ) {}

  @Get('analytics/overview')
  async getOverview(@CurrentUser() user: AuthenticatedUser) {
    await this.assertCanAccess(user, ReportType.REVENUE);
    return this.analyticsService.getOverview();
  }

  @Post('generate')
  async generate(@Body() dto: GenerateReportDto, @CurrentUser() user: AuthenticatedUser) {
    await this.assertCanAccess(user, dto.type);
    const { type, period, startDate, endDate, groupId } = dto;
    return this.reportsService.requestReport(type, { period, startDate, endDate, groupId }, user.userId);
  }

  @Get()
  async listRecent(@CurrentUser() user: AuthenticatedUser) {
    const canExportAll = await this.rbacService.isGranted(user.role, 'reports.export_all');
    const canExportFinancial = await this.rbacService.isGranted(user.role, 'reports.export_financial');
    if (!canExportAll && !canExportFinancial) {
      throw new ForbiddenException('You cannot view reports');
    }

    const reports = await this.reportsService.listRecent();
    return canExportAll ? reports : reports.filter((r) => FINANCIAL_REPORT_TYPES.has(r.type));
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const report = await this.reportsService.findByIdOrFail(id);
    await this.assertCanAccess(user, report.type);

    if (report.status !== ReportStatus.READY || !report.fileKey) {
      throw new BadRequestException(`Report is not ready (status: ${report.status})`);
    }
    return { url: await this.filesService.presignReportDownload(report.fileKey) };
  }

  private async assertCanAccess(user: AuthenticatedUser, type: ReportType): Promise<void> {
    const canExportAll = await this.rbacService.isGranted(user.role, 'reports.export_all');
    if (canExportAll) return;

    if (FINANCIAL_REPORT_TYPES.has(type)) {
      const canExportFinancial = await this.rbacService.isGranted(user.role, 'reports.export_financial');
      if (canExportFinancial) return;
    }
    throw new ForbiddenException(`You cannot access ${type} reports`);
  }
}
