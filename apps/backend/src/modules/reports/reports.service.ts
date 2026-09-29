import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { ReportExport, ReportType, type ReportParams } from './entities/report-export.entity.js';

export const REPORTS_QUEUE = 'reports';

export interface GenerateReportJob {
  reportExportId: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportExport) private readonly exportsRepo: Repository<ReportExport>,
    @InjectQueue(REPORTS_QUEUE) private readonly queue: Queue<GenerateReportJob>,
  ) {}

  async requestReport(type: ReportType, params: ReportParams, requestedByUserId: string): Promise<ReportExport> {
    const filename = `${type.toLowerCase()}_${params.period.toLowerCase()}_${params.startDate}_${params.endDate}.xlsx`;
    const report = await this.exportsRepo.save(
      this.exportsRepo.create({ type, params, requestedByUserId, filename }),
    );
    await this.queue.add('generate', { reportExportId: report.id });
    return report;
  }

  // Excel generation runs through a BullMQ worker (TT §2.5), not inline —
  // reports can span a full date range of payments/attendance/submissions.
  listRecent(limit = 50): Promise<ReportExport[]> {
    return this.exportsRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async findByIdOrFail(id: string): Promise<ReportExport> {
    const report = await this.exportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}
