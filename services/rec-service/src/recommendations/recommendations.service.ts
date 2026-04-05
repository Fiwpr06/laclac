import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Food, FoodDocument } from './schemas/food.schema';

@Injectable()
export class RecommendationsService {
  constructor(@InjectModel(Food.name) private readonly foodModel: Model<FoodDocument>) {}

  getPlaceholderRecommendations(): unknown[] {
    return [];
  }

  async getTrending(limit = 10): Promise<unknown[]> {
    return this.foodModel
      .find({ isActive: true })
      .sort({ popularityScore: -1, updatedAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }
}
