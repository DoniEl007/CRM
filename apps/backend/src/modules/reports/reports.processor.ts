import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { ReportExport, ReportStatus } from './entities/report-export.entity.js';
import { ReportExcelBuilderService } from './report-excel-builder.service.js';
import { FilesService } from '../files/files.service.js';
import { MinioService } from '../files/minio.service.js';
import { REPORTS_QUEUE, type GenerateReportJob } from './reports.service.js';

@Processor(REPORTS_QUEUE)
export class ReportsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(ReportExport) private readonly exportsRepo: Repository<ReportExport>,
    private readonly excelBuilder: ReportExcelBuilderService,
    private readonly filesService: FilesService,
    private readonly minio: MinioService,
  ) {
    super();
  }

  async process(job: Job<GenerateReportJob>): Promise<void> {
    const report = await this.exportsRepo.findOne({ where: { id: job.data.reportExportId } });
    if (!report) return;

    try {
      const buffer = await this.excelBuilder.build(report.type, report.params);
      const objectKey = this.minio.generateObjectKey(report.filename ?? 'report.xlsx');
      await this.filesService.uploadReportFile(objectKey, buffer);

      report.status = ReportStatus.READY;
      report.fileKey = objectKey;
      report.sizeBytes = buffer.length;
      report.generatedAt = new Date();
      await this.exportsRepo.save(report);
    } catch (err) {
      report.status = ReportStatus.FAILED;
      report.errorMessage = (err as Error).message;
      await this.exportsRepo.save(report);
    }
  }
}
