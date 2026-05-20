import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/optional-jwt-auth.guard';
import { OutboxPublisherService } from '../common/outbox/outbox-publisher.service';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { Food, FoodSchema } from './schemas/food.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ShakeHistory, ShakeHistorySchema } from './schemas/shake-history.schema';
import { OutboxEvent, OutboxEventSchema } from './schemas/outbox-event.schema';
import { UserAction, UserActionSchema } from './schemas/user-action.schema';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: UserAction.name, schema: UserActionSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: OutboxEvent.name, schema: OutboxEventSchema },
      { name: Food.name, schema: FoodSchema },
      { name: ShakeHistory.name, schema: ShakeHistorySchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_CLIENT',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: 'laclac_events_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [ActionsController],
  providers: [ActionsService, JwtAuthGuard, OptionalJwtAuthGuard, OutboxPublisherService],
  exports: [ActionsService],
})
export class ActionsModule {}
