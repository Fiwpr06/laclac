import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { OutboxEventDocument } from '../../actions/schemas/outbox-event.schema';

@Injectable()
export class OutboxPublisherService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private changeStream: any;

  constructor(
    @InjectModel('OutboxEvent') private readonly outboxModel: Model<OutboxEventDocument>,
    @Inject('RABBITMQ_CLIENT') private readonly rmqClient: ClientProxy,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Bắt đầu khởi tạo MongoDB Change Stream cho Outbox...');
    this.watchOutbox();
    // Khởi tạo process các event còn kẹt lúc app bị crash (Sweep Fallback)
    this.processPendingEvents();
  }

  onApplicationShutdown() {
    if (this.changeStream) {
      this.changeStream.close();
    }
  }

  private watchOutbox() {
    // Chỉ lắng nghe các thao tác INSERT có trạng thái PENDING
    this.changeStream = this.outboxModel.watch([
      { $match: { operationType: 'insert', 'fullDocument.status': 'PENDING' } },
    ]);

    this.changeStream.on('change', async (change: any) => {
      const event = change.fullDocument;
      this.logger.debug(`[ChangeStream] Phát hiện event mới: ${event.eventId}`);
      await this.publishEvent(event);
    });

    this.changeStream.on('error', (err: any) => {
      this.logger.error('Lỗi Change Stream Outbox', err);
    });
  }

  private async processPendingEvents() {
    const pendingEvents = await this.outboxModel.find({ status: 'PENDING' }).exec();
    if (pendingEvents.length > 0) {
      this.logger.log(`[Sweep] Tìm thấy ${pendingEvents.length} pending events. Bắt đầu publish...`);
      for (const event of pendingEvents) {
        await this.publishEvent(event);
      }
    }
  }

  private async publishEvent(event: any) {
    try {
      // Emit message qua RabbitMQ
      this.rmqClient.emit(event.eventType, {
        eventId: event.eventId,
        payload: event.payload,
        timestamp: event.createdAt,
      });

      this.logger.log(`[Publish] Đã gửi RMQ event: ${event.eventType} - ${event.eventId}`);

      // Cập nhật trạng thái thành PROCESSED
      await this.outboxModel.updateOne(
        { _id: event._id },
        { $set: { status: 'PROCESSED' } }
      );
    } catch (error: any) {
      this.logger.error(`[Publish Error] Gửi RMQ event thất bại: ${event.eventId}`, error);
      await this.outboxModel.updateOne(
        { _id: event._id },
        { $set: { status: 'FAILED', error: error.message } }
      );
    }
  }
}
