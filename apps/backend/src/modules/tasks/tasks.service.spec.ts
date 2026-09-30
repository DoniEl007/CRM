import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../../common/enums/role.enum.js';
import { TasksService } from './tasks.service.js';
import { TaskType } from './entities/task.entity.js';
import { SubmissionStatus } from './entities/submission.entity.js';

function makeRepoMock() {
  return {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn(async (x) => (Array.isArray(x) ? x : { id: 'generated-id', ...x })),
    createQueryBuilder: vi.fn(() => {
      const qb: any = {
        where: vi.fn(() => qb),
        andWhere: vi.fn(() => qb),
        orderBy: vi.fn(() => qb),
        getMany: vi.fn(async () => []),
      };
      return qb;
    }),
  };
}

describe('TasksService', () => {
  let tasksRepo: ReturnType<typeof makeRepoMock>;
  let questionsRepo: ReturnType<typeof makeRepoMock>;
  let submissionsRepo: ReturnType<typeof makeRepoMock>;
  let groupsService: any;
  let notificationsService: any;
  let service: TasksService;

  const TASK_ID = 'task-1';
  const GROUP_ID = 'group-1';
  const TEACHER_ID = 'teacher-1';
  const STUDENT_ID = 'student-1';

  beforeEach(() => {
    tasksRepo = makeRepoMock();
    questionsRepo = makeRepoMock();
    submissionsRepo = makeRepoMock();
    groupsService = {
      findByIdOrFail: vi.fn(async () => ({ id: GROUP_ID, teacherUserId: TEACHER_ID })),
      isMember: vi.fn(async () => true),
      getMembers: vi.fn(async () => []),
    };
    notificationsService = {
      notifyNewAssignment: vi.fn(),
      notifyGradePosted: vi.fn(),
    };
    service = new TasksService(
      tasksRepo as any,
      questionsRepo as any,
      submissionsRepo as any,
      groupsService,
      notificationsService,
    );
  });

  describe('submit — MCQ auto-grading', () => {
    const questions = [
      { id: 'q1', correctOptionIndex: 1 },
      { id: 'q2', correctOptionIndex: 0 },
      { id: 'q3', correctOptionIndex: 2 },
    ];

    beforeEach(() => {
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, groupId: GROUP_ID, type: TaskType.MCQ, titleEn: 'Quiz 1' });
      submissionsRepo.findOne.mockResolvedValue(null); // no existing submission
      questionsRepo.find.mockResolvedValue(questions);
    });

    it('scores exactly the number of matching answers, not more or fewer', async () => {
      const submission = await service.submit(
        TASK_ID,
        {
          answers: [
            { questionId: 'q1', selectedOptionIndex: 1 }, // correct
            { questionId: 'q2', selectedOptionIndex: 1 }, // wrong (correct is 0)
            { questionId: 'q3', selectedOptionIndex: 2 }, // correct
          ],
        },
        STUDENT_ID,
      );
      expect(submission.correctCount).toBe(2);
      expect(submission.totalCount).toBe(3);
      expect(submission.status).toBe(SubmissionStatus.GRADED);
    });

    it('scores zero when every answer is wrong', async () => {
      const submission = await service.submit(
        TASK_ID,
        {
          answers: [
            { questionId: 'q1', selectedOptionIndex: 0 },
            { questionId: 'q2', selectedOptionIndex: 1 },
            { questionId: 'q3', selectedOptionIndex: 0 },
          ],
        },
        STUDENT_ID,
      );
      expect(submission.correctCount).toBe(0);
    });

    it('rejects an answer set with the wrong number of answers', async () => {
      await expect(
        service.submit(TASK_ID, { answers: [{ questionId: 'q1', selectedOptionIndex: 1 }] }, STUDENT_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an answer referencing a question that is not part of this task', async () => {
      await expect(
        service.submit(
          TASK_ID,
          {
            answers: [
              { questionId: 'not-a-real-question', selectedOptionIndex: 0 },
              { questionId: 'q2', selectedOptionIndex: 0 },
              { questionId: 'q3', selectedOptionIndex: 2 },
            ],
          },
          STUDENT_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('triggers a grade-posted notification immediately, since MCQ grades on submit', async () => {
      await service.submit(
        TASK_ID,
        {
          answers: [
            { questionId: 'q1', selectedOptionIndex: 1 },
            { questionId: 'q2', selectedOptionIndex: 0 },
            { questionId: 'q3', selectedOptionIndex: 2 },
          ],
        },
        STUDENT_ID,
      );
      expect(notificationsService.notifyGradePosted).toHaveBeenCalledWith(STUDENT_ID, expect.any(String), 3, 3);
    });
  });

  describe('submit — resubmission protection', () => {
    it('blocks resubmitting a task that has already been graded', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, groupId: GROUP_ID, type: TaskType.TEXT });
      submissionsRepo.findOne.mockResolvedValue({ status: SubmissionStatus.GRADED });

      await expect(service.submit(TASK_ID, { textAnswer: 'new answer' }, STUDENT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows resubmitting a still-PENDING (ungraded) submission', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, groupId: GROUP_ID, type: TaskType.TEXT });
      submissionsRepo.findOne.mockResolvedValue({ status: SubmissionStatus.PENDING, taskId: TASK_ID, studentUserId: STUDENT_ID });

      await expect(service.submit(TASK_ID, { textAnswer: 'revised answer' }, STUDENT_ID)).resolves.toBeDefined();
    });

    it('rejects a student who is not a member of the task\'s group', async () => {
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, groupId: GROUP_ID, type: TaskType.TEXT });
      groupsService.isMember.mockResolvedValue(false);

      await expect(service.submit(TASK_ID, { textAnswer: 'x' }, STUDENT_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('gradeSubmission', () => {
    it('rejects manual grading of an auto-graded (MCQ/AUTO_TEST) submission', async () => {
      submissionsRepo.findOne.mockResolvedValue({ id: 'sub-1', taskId: TASK_ID, studentUserId: STUDENT_ID });
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, teacherUserId: TEACHER_ID, type: TaskType.MCQ });

      await expect(
        service.gradeSubmission('sub-1', { correctCount: 1, totalCount: 1 }, TEACHER_ID, Role.TEACHER),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a teacher grading a submission for a group they do not own', async () => {
      submissionsRepo.findOne.mockResolvedValue({ id: 'sub-1', taskId: TASK_ID, studentUserId: STUDENT_ID });
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, teacherUserId: 'a-different-teacher', type: TaskType.TEXT });

      await expect(
        service.gradeSubmission('sub-1', { correctCount: 1, totalCount: 1 }, TEACHER_ID, Role.TEACHER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects correctCount greater than totalCount', async () => {
      submissionsRepo.findOne.mockResolvedValue({ id: 'sub-1', taskId: TASK_ID, studentUserId: STUDENT_ID });
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, teacherUserId: TEACHER_ID, type: TaskType.TEXT });

      await expect(
        service.gradeSubmission('sub-1', { correctCount: 5, totalCount: 3 }, TEACHER_ID, Role.TEACHER),
      ).rejects.toThrow(BadRequestException);
    });

    it('lets Full Administrator grade any group\'s submission', async () => {
      submissionsRepo.findOne.mockResolvedValue({ id: 'sub-1', taskId: TASK_ID, studentUserId: STUDENT_ID });
      tasksRepo.findOne.mockResolvedValue({ id: TASK_ID, teacherUserId: 'a-different-teacher', type: TaskType.TEXT });

      await expect(
        service.gradeSubmission('sub-1', { correctCount: 2, totalCount: 3 }, 'admin-1', Role.FULL_ADMIN),
      ).resolves.toBeDefined();
    });
  });
});
