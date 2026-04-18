import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/optional-jwt-auth.guard';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { Food, FoodSchema } from './schemas/food.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ShakeHistory, ShakeHistorySchema } from './schemas/shake-history.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UserAction, UserActionSchema } from './schemas/user-action.schema';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: UserAction.name, schema: UserActionSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: User.name, schema: UserSchema },
      { name: Food.name, schema: FoodSchema },
      { name: ShakeHistory.name, schema: ShakeHistorySchema },
    ]),
  ],
  controllers: [ActionsController],
  providers: [ActionsService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [ActionsService],
})
export class ActionsModule {}
