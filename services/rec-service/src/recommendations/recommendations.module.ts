import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { Food, FoodSchema } from './schemas/food.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Food.name, schema: FoodSchema }])],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
