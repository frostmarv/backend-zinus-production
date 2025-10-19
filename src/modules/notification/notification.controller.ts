import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  NotificationRecipientDepartment,
  NotificationType,
} from './entities/notification.entity';

@Controller('notification')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateNotificationDto) {
    const notification = await this.notificationService.send(createDto);

    return {
      success: true,
      message: 'Notification sent successfully',
      data: notification,
    };
  }

  @Get()
  async findAll(
    @Query('recipientDepartment')
    recipientDepartment?: NotificationRecipientDepartment,
    @Query('readStatus') readStatus?: string,
    @Query('type') type?: NotificationType,
    @Query('relatedEntityType') relatedEntityType?: string,
    @Query('relatedEntityId') relatedEntityId?: string,
  ) {
    const filters: any = {};

    if (recipientDepartment) filters.recipientDepartment = recipientDepartment;
    if (readStatus !== undefined) filters.readStatus = readStatus === 'true';
    if (type) filters.type = type;
    if (relatedEntityType) filters.relatedEntityType = relatedEntityType;
    if (relatedEntityId) filters.relatedEntityId = relatedEntityId;

    const data = await this.notificationService.findAll(filters);

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  @Get('unread-count')
  async getUnreadCount(
    @Query('recipientDepartment')
    recipientDepartment?: NotificationRecipientDepartment,
  ) {
    const count =
      await this.notificationService.getUnreadCount(recipientDepartment);

    return {
      success: true,
      data: { count },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.notificationService.findOne(id);

    return {
      success: true,
      data,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationDto,
  ) {
    const data = await this.notificationService.update(id, updateDto);

    return {
      success: true,
      message: 'Notification updated successfully',
      data,
    };
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') id: string) {
    const data = await this.notificationService.markAsRead(id);

    return {
      success: true,
      message: 'Notification marked as read',
      data,
    };
  }

  @Put('read/multiple')
  @HttpCode(HttpStatus.OK)
  async markMultipleAsRead(@Body('ids') ids: string[]) {
    await this.notificationService.markMultipleAsRead(ids);

    return {
      success: true,
      message: `${ids.length} notifications marked as read`,
    };
  }

  @Put('read/all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Query('recipientDepartment')
    recipientDepartment?: NotificationRecipientDepartment,
  ) {
    await this.notificationService.markAllAsRead(recipientDepartment);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.notificationService.remove(id);
  }
}
