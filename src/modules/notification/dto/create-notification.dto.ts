import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationRecipientRole, NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsEnum(NotificationRecipientRole, { each: true })
  recipientRoles: NotificationRecipientRole[];

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;
}
