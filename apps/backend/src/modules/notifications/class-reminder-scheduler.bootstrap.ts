import { Injectable, type OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  CLASS_REMINDER_QUEUE,
  classReminderRepeatableJobOptions,
} from './class-reminder.processor.js';

// Registers the recurring scan job on boot. BullMQ's repeatable-job upsert
// is idempotent for a given jobId + repeat options, so this is safe to run
// on every app start without creating duplicate schedules.
@Injectable()
export class ClassReminderSchedulerBootstrap implements OnModuleInit {
  constructor(@InjectQueue(CLASS_REMINDER_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add('scan', {}, classReminderRepeatableJobOptions);
  }
}
