import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersConsumer {
  private readonly logger = new Logger(UsersConsumer.name);

  constructor(private readonly usersService: UsersService) {}

  @EventPattern('USER_PROFILE_UPDATED')
  async handleUserProfileUpdated(
    @Payload() data: { eventId: string; payload: { userId: string; dto: any }; timestamp: string },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.log(`[Event] Nhận event USER_PROFILE_UPDATED: ${data.eventId}`);
      
      const { userId, dto } = data.payload;

      const updateData: Record<string, any> = {};

      if (dto.dietPreferences?.type) {
        updateData['dietPreferences.type'] = dto.dietPreferences.type;
      }
      if (dto.dietPreferences?.allergies) {
        updateData['dietPreferences.allergies'] = dto.dietPreferences.allergies;
      } else if (dto.allergies) {
        updateData['dietPreferences.allergies'] = dto.allergies;
      }

      await this.usersService.updateProfile(userId, updateData);
      
      this.logger.log(`[Event Success] Cập nhật profile cho user ${userId} thành công`);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`[Event Error] Lỗi khi xử lý USER_PROFILE_UPDATED`, error);
      // ACK luôn để tránh message kẹt lại trong queue. 
      // Ở thực tế production sẽ bắn sang Dead Letter Queue (DLQ).
      channel.ack(originalMsg);
    }
  }
}
