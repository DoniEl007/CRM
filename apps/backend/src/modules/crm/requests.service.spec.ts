import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../common/enums/role.enum.js';
import { RequestsService } from './requests.service.js';
import { RequestStatus } from './entities/request.entity.js';

function makeRepoMock() {
  return {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn(async (x) => x),
  };
}

describe('RequestsService', () => {
  let requestsRepo: ReturnType<typeof makeRepoMock>;
  let usersService: any;
  let rbacService: any;
  let groupsService: any;
  let service: RequestsService;

  const REQUEST_ID = 'req-1';

  beforeEach(() => {
    requestsRepo = makeRepoMock();
    usersService = {
      createUser: vi.fn(async () => ({
        user: { id: 'student-1', preferredLocale: 'en' },
        temporaryPassword: 'Sky-1234-Nord',
      })),
      updateStudentProfile: vi.fn(),
      updatePreferredLocale: vi.fn(),
    };
    rbacService = { isGranted: vi.fn(async () => true) };
    groupsService = { addMember: vi.fn(), findByIdOrFail: vi.fn() };
    service = new RequestsService(requestsRepo as any, usersService, rbacService, groupsService);
  });

  describe('assertOpen (via decline/scheduleTrial)', () => {
    it('blocks declining a request that is already ACTIVE', async () => {
      requestsRepo.findOne.mockResolvedValue({ id: REQUEST_ID, status: RequestStatus.ACTIVE });
      await expect(service.decline(REQUEST_ID, { declineReason: 'x' })).rejects.toThrow(BadRequestException);
    });

    it('blocks scheduling a trial for an already-DECLINED request', async () => {
      requestsRepo.findOne.mockResolvedValue({ id: REQUEST_ID, status: RequestStatus.DECLINED });
      await expect(service.scheduleTrial(REQUEST_ID, { trialLessonAt: new Date().toISOString() })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows declining a NEW request', async () => {
      requestsRepo.findOne.mockResolvedValue({ id: REQUEST_ID, status: RequestStatus.NEW });
      await expect(service.decline(REQUEST_ID, { declineReason: 'x' })).resolves.toBeDefined();
    });
  });

  describe('activate', () => {
    beforeEach(() => {
      requestsRepo.findOne.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.TRIAL_DONE,
        convertedStudent: null, // as loaded by findByIdOrFail's relations
        assignedGroupId: undefined,
      });
    });

    it('requires the credentials.create permission, independent of the controller-level guard', async () => {
      rbacService.isGranted.mockResolvedValue(false);
      await expect(
        service.activate(REQUEST_ID, { email: 'a@b.com', firstName: 'A', lastName: 'B' }, Role.ADMIN_STAFF),
      ).rejects.toThrow(ForbiddenException);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('sets convertedStudentUserId on the SAVED request — regression test for the ' +
      'TypeORM relation/FK-column bug (an already-loaded null `convertedStudent` ' +
      'relation silently overwrote a plain convertedStudentUserId assignment)', async () => {
      const { request } = await service.activate(
        REQUEST_ID,
        { email: 'a@b.com', firstName: 'A', lastName: 'B' },
        Role.FULL_ADMIN,
      );
      expect(request.convertedStudentUserId).toBe('student-1');
      expect(request.convertedStudent).toEqual({ id: 'student-1', preferredLocale: 'en' });
      expect(request.status).toBe(RequestStatus.ACTIVE);
    });

    it('enrolls into an explicit groupId over the request\'s assignedGroupId', async () => {
      requestsRepo.findOne.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.TRIAL_DONE,
        convertedStudent: null,
        assignedGroupId: 'group-from-trial',
      });
      await service.activate(
        REQUEST_ID,
        { email: 'a@b.com', firstName: 'A', lastName: 'B', groupId: 'group-explicit' },
        Role.FULL_ADMIN,
      );
      expect(groupsService.addMember).toHaveBeenCalledWith('group-explicit', 'student-1');
    });

    it('falls back to the request\'s assignedGroupId when no explicit groupId is given', async () => {
      requestsRepo.findOne.mockResolvedValue({
        id: REQUEST_ID,
        status: RequestStatus.TRIAL_DONE,
        convertedStudent: null,
        assignedGroupId: 'group-from-trial',
      });
      await service.activate(REQUEST_ID, { email: 'a@b.com', firstName: 'A', lastName: 'B' }, Role.FULL_ADMIN);
      expect(groupsService.addMember).toHaveBeenCalledWith('group-from-trial', 'student-1');
    });

    it('reflects the persisted preferredLocale on the returned user object, not the stale pre-update value', async () => {
      const { user } = await service.activate(
        REQUEST_ID,
        { email: 'a@b.com', firstName: 'A', lastName: 'B', preferredLocale: 'uz-Latn' },
        Role.FULL_ADMIN,
      );
      expect(usersService.updatePreferredLocale).toHaveBeenCalledWith('student-1', 'uz-Latn');
      expect(user.preferredLocale).toBe('uz-Latn'); // not the 'en' the mock createUser returned
    });

    it('blocks activating an already-ACTIVE request', async () => {
      requestsRepo.findOne.mockResolvedValue({ id: REQUEST_ID, status: RequestStatus.ACTIVE });
      await expect(
        service.activate(REQUEST_ID, { email: 'a@b.com', firstName: 'A', lastName: 'B' }, Role.FULL_ADMIN),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
