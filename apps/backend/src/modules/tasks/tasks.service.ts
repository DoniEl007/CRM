import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { GroupsService } from '../groups/groups.service.js';
import { Task, TaskType } from './entities/task.entity.js';
import { TaskQuestion } from './entities/task-question.entity.js';
import { Submission, SubmissionStatus, type McqAnswer } from './entities/submission.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { SubmitTaskDto } from './dto/submit-task.dto.js';
import { GradeSubmissionDto } from './dto/grade-submission.dto.js';

const AUTO_GRADED_TYPES = new Set([TaskType.MCQ, TaskType.AUTO_TEST]);

export interface RatingEntry {
  studentUserId: string;
  firstName: string;
  lastName: string;
  correctCount: number;
  totalCount: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasksRepo: Repository<Task>,
    @InjectRepository(TaskQuestion) private readonly questionsRepo: Repository<TaskQuestion>,
    @InjectRepository(Submission) private readonly submissionsRepo: Repository<Submission>,
    private readonly groupsService: GroupsService,
  ) {}

  async create(dto: CreateTaskDto, teacherUserId: string, requesterRole: Role): Promise<Task> {
    const group = await this.groupsService.findByIdOrFail(dto.groupId);
    this.assertOwnsGroup(group.teacherUserId, teacherUserId, requesterRole);

    if (AUTO_GRADED_TYPES.has(dto.type) && (!dto.questions || dto.questions.length === 0)) {
      throw new BadRequestException('MCQ and AUTO_TEST tasks require at least one question');
    }

    const task = await this.tasksRepo.save(
      this.tasksRepo.create({
        groupId: dto.groupId,
        teacherUserId,
        titleEn: dto.titleEn,
        titleRu: dto.titleRu,
        titleUzLatn: dto.titleUzLatn,
        titleUzCyrl: dto.titleUzCyrl,
        descriptionEn: dto.descriptionEn,
        descriptionRu: dto.descriptionRu,
        descriptionUzLatn: dto.descriptionUzLatn,
        descriptionUzCyrl: dto.descriptionUzCyrl,
        type: dto.type,
        attachmentFileKey: dto.attachmentFileKey,
      }),
    );

    if (dto.questions?.length) {
      await this.questionsRepo.save(
        dto.questions.map((q, index) =>
          this.questionsRepo.create({
            taskId: task.id,
            sortOrder: index,
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
          }),
        ),
      );
    }

    return task;
  }

  findForGroup(groupId: string): Promise<Task[]> {
    return this.tasksRepo.find({ where: { groupId }, order: { createdAt: 'DESC' } });
  }

  async findForStudent(studentUserId: string): Promise<Array<Task & { submissionStatus: SubmissionStatus | null }>> {
    const groupIds = await this.groupsService.findGroupIdsForStudent(studentUserId);
    if (groupIds.length === 0) return [];

    const tasks = await this.tasksRepo
      .createQueryBuilder('task')
      .where('task.group_id IN (:...groupIds)', { groupIds })
      .orderBy('task.created_at', 'DESC')
      .getMany();

    const submissions = await this.submissionsRepo.find({ where: { studentUserId } });
    const statusByTask = new Map(submissions.map((s) => [s.taskId, s.status]));

    return tasks.map((task) => ({ ...task, submissionStatus: statusByTask.get(task.id) ?? null }));
  }

  async findByIdOrFail(id: string): Promise<Task> {
    const task = await this.tasksRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  getQuestions(taskId: string): Promise<TaskQuestion[]> {
    return this.questionsRepo.find({ where: { taskId }, order: { sortOrder: 'ASC' } });
  }

  async assertCanAccessTask(task: Task, userId: string, role: Role): Promise<void> {
    if (role === Role.FULL_ADMIN) return;
    if (role === Role.TEACHER && task.teacherUserId === userId) return;
    if (role === Role.STUDENT && (await this.groupsService.isMember(task.groupId, userId))) return;
    throw new ForbiddenException('You do not have access to this task');
  }

  async submit(taskId: string, dto: SubmitTaskDto, studentUserId: string): Promise<Submission> {
    const task = await this.findByIdOrFail(taskId);
    const isMember = await this.groupsService.isMember(task.groupId, studentUserId);
    if (!isMember) throw new ForbiddenException('You are not a member of this task\'s group');

    const existing = await this.submissionsRepo.findOne({ where: { taskId, studentUserId } });
    if (existing?.status === SubmissionStatus.GRADED) {
      throw new BadRequestException('This task has already been graded and cannot be resubmitted');
    }

    const submission = existing ?? this.submissionsRepo.create({ taskId, studentUserId });
    submission.submittedAt = new Date();

    if (task.type === TaskType.FILE) {
      if (!dto.fileKey) throw new BadRequestException('fileKey is required for FILE tasks');
      submission.fileKey = dto.fileKey;
      submission.status = SubmissionStatus.PENDING;
    } else if (task.type === TaskType.TEXT) {
      if (!dto.textAnswer) throw new BadRequestException('textAnswer is required for TEXT tasks');
      submission.textAnswer = dto.textAnswer;
      submission.status = SubmissionStatus.PENDING;
    } else {
      // MCQ / AUTO_TEST — auto-graded on submission.
      const questions = await this.getQuestions(taskId);
      if (!dto.answers || dto.answers.length !== questions.length) {
        throw new BadRequestException(`This task has ${questions.length} question(s); answers must cover all of them`);
      }
      const { correctCount, answers } = this.gradeMcqAnswers(questions, dto.answers);
      submission.answers = answers;
      submission.correctCount = correctCount;
      submission.totalCount = questions.length;
      submission.status = SubmissionStatus.GRADED;
      submission.gradedAt = new Date();
    }

    return this.submissionsRepo.save(submission);
  }

  async gradeSubmission(
    submissionId: string,
    dto: GradeSubmissionDto,
    graderUserId: string,
    graderRole: Role,
  ): Promise<Submission> {
    const submission = await this.submissionsRepo.findOne({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Submission not found');

    const task = await this.findByIdOrFail(submission.taskId);
    this.assertOwnsGroup(task.teacherUserId, graderUserId, graderRole);

    if (AUTO_GRADED_TYPES.has(task.type)) {
      throw new BadRequestException('MCQ and AUTO_TEST submissions are graded automatically');
    }
    if (dto.correctCount > dto.totalCount) {
      throw new BadRequestException('correctCount cannot exceed totalCount');
    }

    submission.correctCount = dto.correctCount;
    submission.totalCount = dto.totalCount;
    submission.status = SubmissionStatus.GRADED;
    submission.gradedByUserId = graderUserId;
    submission.gradedAt = new Date();
    return this.submissionsRepo.save(submission);
  }

  listSubmissionsForTask(taskId: string): Promise<Submission[]> {
    return this.submissionsRepo.find({ where: { taskId }, relations: { student: true } });
  }

  // Per-group rating dashboard (TT §3.5): ranked by total correct answers
  // across all of the group's graded submissions.
  async getGroupRating(groupId: string): Promise<RatingEntry[]> {
    const members = await this.groupsService.getMembers(groupId);
    const tasks = await this.tasksRepo.find({ where: { groupId } });
    const taskIds = tasks.map((t) => t.id);

    const submissions =
      taskIds.length === 0
        ? []
        : await this.submissionsRepo
            .createQueryBuilder('submission')
            .where('submission.task_id IN (:...taskIds)', { taskIds })
            .andWhere('submission.status = :status', { status: SubmissionStatus.GRADED })
            .getMany();

    const totals = new Map<string, { correct: number; total: number }>();
    for (const s of submissions) {
      const current = totals.get(s.studentUserId) ?? { correct: 0, total: 0 };
      current.correct += s.correctCount ?? 0;
      current.total += s.totalCount ?? 0;
      totals.set(s.studentUserId, current);
    }

    return members
      .map((m) => {
        const totalsForStudent = totals.get(m.studentUserId) ?? { correct: 0, total: 0 };
        return {
          studentUserId: m.studentUserId,
          firstName: m.student.firstName,
          lastName: m.student.lastName,
          correctCount: totalsForStudent.correct,
          totalCount: totalsForStudent.total,
        };
      })
      .sort((a, b) => b.correctCount - a.correctCount);
  }

  // Student's own aggregate results + rank, across every group they belong
  // to (TT §3.7: "view their own results and group rating").
  async getMyResults(
    studentUserId: string,
  ): Promise<Array<{ groupId: string; correctCount: number; totalCount: number; rank: number; groupSize: number }>> {
    const groupIds = await this.groupsService.findGroupIdsForStudent(studentUserId);
    const results = [];
    for (const groupId of groupIds) {
      const rating = await this.getGroupRating(groupId);
      const rank = rating.findIndex((r) => r.studentUserId === studentUserId) + 1;
      const own = rating.find((r) => r.studentUserId === studentUserId);
      results.push({
        groupId,
        correctCount: own?.correctCount ?? 0,
        totalCount: own?.totalCount ?? 0,
        rank,
        groupSize: rating.length,
      });
    }
    return results;
  }

  private gradeMcqAnswers(
    questions: TaskQuestion[],
    answers: Array<{ questionId: string; selectedOptionIndex: number }>,
  ): { correctCount: number; answers: McqAnswer[] } {
    const correctByQuestionId = new Map(questions.map((q) => [q.id, q.correctOptionIndex]));
    let correctCount = 0;
    for (const answer of answers) {
      const correctIndex = correctByQuestionId.get(answer.questionId);
      if (correctIndex === undefined) {
        throw new BadRequestException(`Question ${answer.questionId} does not belong to this task`);
      }
      if (answer.selectedOptionIndex === correctIndex) correctCount += 1;
    }
    return { correctCount, answers };
  }

  private assertOwnsGroup(groupTeacherUserId: string, requesterId: string, requesterRole: Role): void {
    if (requesterRole === Role.FULL_ADMIN) return;
    if (groupTeacherUserId !== requesterId) {
      throw new ForbiddenException('You can only manage tasks for your own groups');
    }
  }
}
