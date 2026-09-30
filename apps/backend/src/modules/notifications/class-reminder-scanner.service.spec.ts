import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClassReminderScannerService } from './class-reminder-scanner.service.js';
import { DayOfWeek } from '../groups/entities/schedule-slot.entity.js';

function makeRedisMock() {
  const store = new Set<string>();
  return {
    // Mirrors real Redis SET ... NX: returns 'OK' the first time, null after.
    set: vi.fn(async (key: string) => {
      if (store.has(key)) return null;
      store.add(key);
      return 'OK';
    }),
  };
}

describe('ClassReminderScannerService', () => {
  let slotsRepo: { find: ReturnType<typeof vi.fn> };
  let groupsService: { getMembers: ReturnType<typeof vi.fn> };
  let notificationsService: { notifyClassReminder: ReturnType<typeof vi.fn> };
  let redis: ReturnType<typeof makeRedisMock>;
  let service: ClassReminderScannerService;

  // A Wednesday, so DayOfWeek.WEDNESDAY slots are the ones in play.
  const WEDNESDAY_NOON = new Date('2026-09-30T12:00:00');
  const slot = {
    id: 'slot-1',
    groupId: 'group-1',
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startTime: '14:00:00',
    group: { name: 'IT-Group-1', teacherUserId: 'teacher-1' },
  };

  beforeEach(() => {
    slotsRepo = { find: vi.fn(async () => [slot]) };
    groupsService = { getMembers: vi.fn(async () => [{ studentUserId: 'student-1' }]) };
    notificationsService = { notifyClassReminder: vi.fn() };
    redis = makeRedisMock();
    service = new ClassReminderScannerService(
      slotsRepo as any,
      groupsService as any,
      notificationsService as any,
      redis as any,
    );
  });

  it('sends a reminder to the teacher and every enrolled student when a slot starts in ~60 minutes', async () => {
    const now = new Date(WEDNESDAY_NOON);
    now.setHours(13, 0, 0, 0); // 60 minutes before 14:00

    await service.scan(now);

    expect(notificationsService.notifyClassReminder).toHaveBeenCalledWith('teacher-1', 'IT-Group-1', '14:00');
    expect(notificationsService.notifyClassReminder).toHaveBeenCalledWith('student-1', 'IT-Group-1', '14:00');
    expect(notificationsService.notifyClassReminder).toHaveBeenCalledTimes(2);
  });

  it('does nothing for a slot starting 2 hours out (outside the 55-65 min window)', async () => {
    const now = new Date(WEDNESDAY_NOON);
    now.setHours(12, 0, 0, 0); // 120 minutes before 14:00

    await service.scan(now);

    expect(notificationsService.notifyClassReminder).not.toHaveBeenCalled();
  });

  it('does nothing for a slot that just started (negative minutes-until-start)', async () => {
    const now = new Date(WEDNESDAY_NOON);
    now.setHours(14, 5, 0, 0); // 5 minutes AFTER 14:00

    await service.scan(now);

    expect(notificationsService.notifyClassReminder).not.toHaveBeenCalled();
  });

  it('does not send a second reminder for the same slot occurrence (Redis dedupe)', async () => {
    const now = new Date(WEDNESDAY_NOON);
    now.setHours(13, 0, 0, 0);

    await service.scan(now);
    await service.scan(now);

    expect(notificationsService.notifyClassReminder).toHaveBeenCalledTimes(2); // not 4
  });

  it('only queries slots for the current day of week', async () => {
    const now = new Date(WEDNESDAY_NOON);
    now.setHours(13, 0, 0, 0);

    await service.scan(now);

    expect(slotsRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dayOfWeek: DayOfWeek.WEDNESDAY } }),
    );
  });
});
