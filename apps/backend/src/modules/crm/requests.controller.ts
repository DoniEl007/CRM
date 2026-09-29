import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import { RequestsService } from './requests.service.js';
import { RequestStatus } from './entities/request.entity.js';
import { CreateManualRequestDto } from './dto/create-manual-request.dto.js';
import { ScheduleTrialDto } from './dto/schedule-trial.dto.js';
import { DeclineRequestDto } from './dto/decline-request.dto.js';
import { ActivateRequestDto } from './dto/activate-request.dto.js';

@Controller('crm/requests')
@RequirePermission('crm.manage')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll(@Query('status') status?: RequestStatus) {
    return this.requestsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findByIdOrFail(id);
  }

  @Post()
  createManual(@Body() dto: CreateManualRequestDto) {
    return this.requestsService.createManual(dto);
  }

  @Patch(':id/schedule-trial')
  scheduleTrial(@Param('id') id: string, @Body() dto: ScheduleTrialDto) {
    return this.requestsService.scheduleTrial(id, dto);
  }

  @Patch(':id/trial-done')
  markTrialDone(@Param('id') id: string) {
    return this.requestsService.markTrialDone(id);
  }

  @Patch(':id/decline')
  decline(@Param('id') id: string, @Body() dto: DeclineRequestDto) {
    return this.requestsService.decline(id, dto);
  }

  @Patch(':id/activate')
  activate(
    @Param('id') id: string,
    @Body() dto: ActivateRequestDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.requestsService.activate(id, dto, currentUser.role);
  }
}
