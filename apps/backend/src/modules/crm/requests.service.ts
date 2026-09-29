import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { RbacService } from '../identity/rbac/rbac.service.js';
import { UsersService, type CreatedUserResult } from '../identity/users/users.service.js';
import { Request, RequestSource, RequestStatus } from './entities/request.entity.js';
import { CreateInquiryDto } from './dto/create-inquiry.dto.js';
import { CreateManualRequestDto } from './dto/create-manual-request.dto.js';
import { ScheduleTrialDto } from './dto/schedule-trial.dto.js';
import { DeclineRequestDto } from './dto/decline-request.dto.js';
import { ActivateRequestDto } from './dto/activate-request.dto.js';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request) private readonly requestsRepo: Repository<Request>,
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
  ) {}

  // Public contact-form submission (TT §3.1) — always source=WEBSITE, always NEW.
  createFromWebsite(dto: CreateInquiryDto): Promise<Request> {
    return this.requestsRepo.save(
      this.requestsRepo.create({
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        message: dto.message,
        courseInterestId: dto.courseInterestId,
        source: RequestSource.WEBSITE,
        status: RequestStatus.NEW,
      }),
    );
  }

  createManual(dto: CreateManualRequestDto): Promise<Request> {
    return this.requestsRepo.save(
      this.requestsRepo.create({
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        courseInterestId: dto.courseInterestId,
        notes: dto.notes,
        source: RequestSource.MANUAL,
        status: RequestStatus.NEW,
      }),
    );
  }

  findAll(status?: RequestStatus): Promise<Request[]> {
    return this.requestsRepo.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      relations: { courseInterest: true },
    });
  }

  async findByIdOrFail(id: string): Promise<Request> {
    const request = await this.requestsRepo.findOne({
      where: { id },
      relations: { courseInterest: true, convertedStudent: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async scheduleTrial(id: string, dto: ScheduleTrialDto): Promise<Request> {
    const request = await this.assertOpen(id);
    request.status = RequestStatus.TRIAL_SCHEDULED;
    request.trialLessonAt = new Date(dto.trialLessonAt);
    return this.requestsRepo.save(request);
  }

  async markTrialDone(id: string): Promise<Request> {
    const request = await this.findByIdOrFail(id);
    if (request.status !== RequestStatus.TRIAL_SCHEDULED) {
      throw new BadRequestException('Trial must be scheduled before it can be marked done');
    }
    request.status = RequestStatus.TRIAL_DONE;
    return this.requestsRepo.save(request);
  }

  async decline(id: string, dto: DeclineRequestDto): Promise<Request> {
    const request = await this.assertOpen(id);
    request.status = RequestStatus.DECLINED;
    request.declineReason = dto.declineReason;
    return this.requestsRepo.save(request);
  }

  // Converts a request into an active, paying student: creates the Student
  // login (TT §3.2) and links it back to the request. Gated separately on
  // 'credentials.create' in addition to the controller's 'crm.manage' guard,
  // since — under the configurable RBAC model — a role could be granted CRM
  // management without also being allowed to provision logins.
  async activate(
    id: string,
    dto: ActivateRequestDto,
    requestedByRole: Role,
  ): Promise<{ request: Request } & CreatedUserResult> {
    const canProvisionCredentials = await this.rbacService.isGranted(requestedByRole, 'credentials.create');
    if (!canProvisionCredentials) {
      throw new ForbiddenException('Missing permission: credentials.create');
    }

    const request = await this.assertOpen(id);

    const { user, temporaryPassword } = await this.usersService.createUser(
      {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: Role.STUDENT,
      },
      requestedByRole,
    );

    request.status = RequestStatus.ACTIVE;
    // `assertOpen` loads the `convertedStudent` relation, so it's already an
    // explicit `null` on this entity instance. TypeORM derives the FK column
    // from the relation object on save, which would silently overwrite a
    // plain `convertedStudentUserId = user.id` assignment back to null — the
    // relation object itself must be reassigned, not just the FK column.
    request.convertedStudent = user;
    request.convertedStudentUserId = user.id;
    const saved = await this.requestsRepo.save(request);

    return { request: saved, user, temporaryPassword };
  }

  private async assertOpen(id: string): Promise<Request> {
    const request = await this.findByIdOrFail(id);
    if (request.status === RequestStatus.ACTIVE || request.status === RequestStatus.DECLINED) {
      throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
    }
    return request;
  }
}
