import { IsBoolean } from 'class-validator';

export class SetNotificationSettingDto {
  @IsBoolean()
  enabled!: boolean;
}
