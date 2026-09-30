import { ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../../common/enums/role.enum.js';
import { UsersService } from './users.service.js';

function makeRepoMock() {
  return {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn(async (x) => ({ id: 'generated-id', ...x })),
    update: vi.fn(),
    createQueryBuilder: vi.fn(() => {
      const qb: any = {
        update: vi.fn(() => qb),
        set: vi.fn(() => qb),
        where: vi.fn(() => qb),
        execute: vi.fn(async () => undefined),
      };
      return qb;
    }),
  };
}

describe('UsersService', () => {
  let usersRepo: ReturnType<typeof makeRepoMock>;
  let studentProfilesRepo: ReturnType<typeof makeRepoMock>;
  let teacherProfilesRepo: ReturnType<typeof makeRepoMock>;
  let service: UsersService;

  beforeEach(() => {
    usersRepo = makeRepoMock();
    studentProfilesRepo = makeRepoMock();
    teacherProfilesRepo = makeRepoMock();
    service = new UsersService(usersRepo as any, studentProfilesRepo as any, teacherProfilesRepo as any);
  });

  describe('createUser', () => {
    const baseDto = { email: 'new@example.com', firstName: 'A', lastName: 'B' };

    it('lets Administrative Staff create a Student account', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.createUser({ ...baseDto, role: Role.STUDENT }, Role.ADMIN_STAFF);
      expect(result.user.role).toBe(Role.STUDENT);
      expect(studentProfilesRepo.save).toHaveBeenCalledOnce();
    });

    it('blocks Administrative Staff from creating a non-Student account', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.createUser({ ...baseDto, role: Role.TEACHER }, Role.ADMIN_STAFF)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lets Full Administrator create any role', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.createUser({ ...baseDto, role: Role.TEACHER }, Role.FULL_ADMIN);
      expect(result.user.role).toBe(Role.TEACHER);
      expect(teacherProfilesRepo.save).toHaveBeenCalledOnce();
    });

    it('rejects a duplicate email', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.createUser({ ...baseDto, role: Role.STUDENT }, Role.FULL_ADMIN)).rejects.toThrow(
        ConflictException,
      );
    });

    it('generates a human-readable "Word-NNNN-Word" temporary password', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.createUser({ ...baseDto, role: Role.STUDENT }, Role.FULL_ADMIN);
      expect(result.temporaryPassword).toMatch(/^[A-Za-z]+-\d{4}-[A-Za-z]+$/);

      const [firstWord, , secondWord] = result.temporaryPassword.split('-');
      expect(firstWord).not.toBe(secondWord); // the two words are never the same
    });

    it('never creates a profile row for CEO/Admin Staff accounts', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await service.createUser({ ...baseDto, role: Role.CEO }, Role.FULL_ADMIN);
      expect(studentProfilesRepo.save).not.toHaveBeenCalled();
      expect(teacherProfilesRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('regeneratePassword', () => {
    it('blocks Administrative Staff from resetting a non-Student password', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'u1', role: Role.TEACHER, passwordHash: 'old' });
      await expect(service.regeneratePassword('u1', Role.ADMIN_STAFF)).rejects.toThrow(ForbiddenException);
    });

    it('lets Administrative Staff reset a Student password', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'u1', role: Role.STUDENT, passwordHash: 'old' });
      const result = await service.regeneratePassword('u1', Role.ADMIN_STAFF);
      expect(result.temporaryPassword).toMatch(/^[A-Za-z]+-\d{4}-[A-Za-z]+$/);
      expect(usersRepo.save).toHaveBeenCalledOnce();
    });
  });
});
