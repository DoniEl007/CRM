import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { AppBaseEntity } from '../../../common/entities/app-base.entity.js';
import { Group } from './group.entity.js';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// A recurring weekly lesson slot for a group (TT §3.3 class timetable).
@Entity('schedule_slots')
export class ScheduleSlot extends AppBaseEntity {
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Relation<Group>;

  @Column({ name: 'group_id' })
  groupId!: string;

  @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
  dayOfWeek!: DayOfWeek;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;
}
