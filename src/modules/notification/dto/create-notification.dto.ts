import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  NotificationRecipientDepartment,
  NotificationType,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsEnum(NotificationRecipientDepartment, { each: true })
  recipientDepartments: NotificationRecipientDepartment[]; // Ganti dari recipientRoles

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsString()
  @IsOptional()
  relatedEntityId?: string;
}
