import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupsService } from './groups.service.js';
import { ScheduleSlot } from './entities/schedule-slot.entity.js';
import { CreateScheduleSlotDto } from './dto/schedule-slot.dto.js';

@Injectable()
export class ScheduleSlotsService {
  constructor(
    @InjectRepository(ScheduleSlot) private readonly slotsRepo: Repository<ScheduleSlot>,
    private readonly groupsService: GroupsService,
  ) {}

  async listForGroup(groupId: string): Promise<ScheduleSlot[]> {
    await this.groupsService.findByIdOrFail(groupId);
    return this.slotsRepo.find({ where: { groupId }, order: { dayOfWeek: 'ASC', startTime: 'ASC' } });
  }

  async create(groupId: string, dto: CreateScheduleSlotDto): Promise<ScheduleSlot> {
    await this.groupsService.findByIdOrFail(groupId);
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
    return this.slotsRepo.save(this.slotsRepo.create({ groupId, ...dto }));
  }

  async remove(groupId: string, slotId: string): Promise<void> {
    const result = await this.slotsRepo.delete({ id: slotId, groupId });
    if (result.affected === 0) throw new NotFoundException('Schedule slot not found');
  }
}
