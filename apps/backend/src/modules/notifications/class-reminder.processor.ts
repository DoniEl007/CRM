import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ClassReminderScannerService } from './class-reminder-scanner.service.js';

export const CLASS_REMINDER_QUEUE = 'class-reminder-scan';
export const CLASS_REMINDER_REPEAT_JOB_ID = 'class-reminder-scan-repeat';
const SCAN_INTERVAL_MS = 5 * 60 * 1000;

export const classReminderRepeatableJobOptions = {
  repeat: { every: SCAN_INTERVAL_MS },
  jobId: CLASS_REMINDER_REPEAT_JOB_ID,
};

@Processor(CLASS_REMINDER_QUEUE)
export class ClassReminderProcessor extends WorkerHost {
  constructor(private readonly scanner: ClassReminderScannerService) {
    super();
  }

  async process(): Promise<void> {
    await this.scanner.scan();
  }
}
