import { BadRequestException, ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../common/enums/role.enum.js';
import { GroupsService, MAX_GROUP_SIZE } from './groups.service.js';
import { GroupCategory } from './entities/group.entity.js';

function makeRepoMock() {
  return {
    findOne: vi.fn(),
    find: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn(async (x) => ({ id: 'generated-id', ...x })),
  };
}

describe('GroupsService', () => {
  let groupsRepo: ReturnType<typeof makeRepoMock>;
  let membershipsRepo: ReturnType<typeof makeRepoMock>;
  let usersService: { findById: ReturnType<typeof vi.fn> };
  let chatService: { createGroupConversation: ReturnType<typeof vi.fn>; addParticipantToGroupChat: ReturnType<typeof vi.fn>; removeParticipantFromGroupChat: ReturnType<typeof vi.fn> };
  let service: GroupsService;

  const GROUP_ID = 'group-1';
  const TEACHER_ID = 'teacher-1';
  const STUDENT_ID = 'student-1';

  beforeEach(() => {
    groupsRepo = makeRepoMock();
    membershipsRepo = makeRepoMock();
    usersService = { findById: vi.fn() };
    chatService = {
      createGroupConversation: vi.fn(),
      addParticipantToGroupChat: vi.fn(),
      removeParticipantFromGroupChat: vi.fn(),
    };
    service = new GroupsService(groupsRepo as any, membershipsRepo as any, usersService as any, chatService as any);
    groupsRepo.findOne.mockResolvedValue({ id: GROUP_ID, teacherUserId: TEACHER_ID });
  });

  describe('create', () => {
    it('rejects a teacherUserId that is not a TEACHER', async () => {
      usersService.findById.mockResolvedValue({ id: TEACHER_ID, role: Role.STUDENT });
      await expect(
        service.create({ name: 'X', category: GroupCategory.IT, teacherUserId: TEACHER_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the group chat conversation alongside the group', async () => {
      usersService.findById.mockResolvedValue({ id: TEACHER_ID, role: Role.TEACHER });
      const group = await service.create({ name: 'X', category: GroupCategory.IT, teacherUserId: TEACHER_ID });
      expect(chatService.createGroupConversation).toHaveBeenCalledWith(group.id, [TEACHER_ID]);
    });
  });

  describe('addMember', () => {
    beforeEach(() => {
      usersService.findById.mockResolvedValue({ id: STUDENT_ID, role: Role.STUDENT });
      membershipsRepo.findOne.mockResolvedValue(null); // not already a member
    });

    it('rejects a studentUserId that is not a STUDENT', async () => {
      usersService.findById.mockResolvedValue({ id: STUDENT_ID, role: Role.TEACHER });
      membershipsRepo.count.mockResolvedValue(0);
      await expect(service.addMember(GROUP_ID, STUDENT_ID)).rejects.toThrow(BadRequestException);
    });

    it('rejects adding a student who is already a member', async () => {
      membershipsRepo.findOne.mockResolvedValue({ id: 'existing-membership' });
      await expect(service.addMember(GROUP_ID, STUDENT_ID)).rejects.toThrow(ConflictException);
    });

    it(`allows adding up to exactly ${MAX_GROUP_SIZE} members`, async () => {
      membershipsRepo.count.mockResolvedValue(MAX_GROUP_SIZE - 1);
      await expect(service.addMember(GROUP_ID, STUDENT_ID)).resolves.toBeDefined();
    });

    it(`rejects the ${MAX_GROUP_SIZE + 1}th member`, async () => {
      membershipsRepo.count.mockResolvedValue(MAX_GROUP_SIZE);
      await expect(service.addMember(GROUP_ID, STUDENT_ID)).rejects.toThrow(BadRequestException);
    });

    it('syncs the new member into the group chat', async () => {
      membershipsRepo.count.mockResolvedValue(0);
      await service.addMember(GROUP_ID, STUDENT_ID);
      expect(chatService.addParticipantToGroupChat).toHaveBeenCalledWith(GROUP_ID, STUDENT_ID);
    });
  });

  describe('removeMember', () => {
    it('syncs the removal out of the group chat', async () => {
      membershipsRepo.delete.mockResolvedValue({ affected: 1 });
      await service.removeMember(GROUP_ID, STUDENT_ID);
      expect(chatService.removeParticipantFromGroupChat).toHaveBeenCalledWith(GROUP_ID, STUDENT_ID);
    });

    it('throws if there was no such membership', async () => {
      membershipsRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeMember(GROUP_ID, STUDENT_ID)).rejects.toThrow();
      expect(chatService.removeParticipantFromGroupChat).not.toHaveBeenCalled();
    });
  });
});
