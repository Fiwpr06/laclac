import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Model, Types, isValidObjectId } from 'mongoose';

import { RequestUser } from '../common/request-user.interface';
import { ActionDto } from './dto/action.dto';
import { FavoriteDto } from './dto/favorite.dto';
import { ReviewDto } from './dto/review.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { Food, FoodDocument } from './schemas/food.schema';
import { Review, ReviewDocument } from './schemas/review.schema';
import { User, UserDocument } from './schemas/user.schema';
import { UserAction, UserActionDocument } from './schemas/user-action.schema';

interface StoredAction {
  userId?: string;
  sessionId: string;
  foodId?: string;
  actionType:
    | 'swipe_right'
    | 'swipe_left'
    | 'view_detail'
    | 'shake_result'
    | 'favorite_add'
    | 'favorite_remove'
    | 'review_submit';
  context: 'solo' | 'date' | 'group' | 'travel' | 'office' | 'none';
  triggerType?: 'shake' | 'button';
  filterSnapshot: {
    priceRange?: string;
    budgetBucket?: string;
    dishType?: string;
    cuisineType?: string;
    mealType?: string;
    dietTag?: string;
    category?: string;
  };
  deviceType: 'mobile' | 'web';
  sessionDurationMs?: number;
}

export const computePopularityScore = (counts: {
  swipeRight: number;
  viewDetail: number;
  favoriteAdd: number;
  reviewSubmit: number;
}): number => {
  return (
    counts.swipeRight * 2 + counts.viewDetail + counts.favoriteAdd * 3 + counts.reviewSubmit * 4
  );
};

@Injectable()
export class ActionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ActionsService.name);
  private redis?: IORedis;
  private queue?: Queue<StoredAction>;
  private worker?: Worker<StoredAction>;
  private redisWarned = false;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(UserAction.name) private readonly actionModel: Model<UserActionDocument>,
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<FavoriteDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Food.name) private readonly foodModel: Model<FoodDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');

    if (!this.isRedisUrl(redisUrl)) {
      this.logger.warn(
        `REDIS_URL must start with redis:// or rediss://. Queue disabled, actions will be written directly to MongoDB.`,
      );
      return;
    }

    this.redis = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.redis.on('error', (error: Error) => {
      if (!this.redisWarned) {
        this.redisWarned = true;
        this.logger.warn(
          `Redis queue unavailable (${error.message}). Actions will fallback to direct MongoDB writes.`,
        );
      }
    });

    this.queue = new Queue<StoredAction>('user-actions', {
      connection: this.redis,
    });

    this.worker = new Worker<StoredAction>(
      'user-actions',
      async (job: Job<StoredAction>) => {
        await this.persistAction(job.data);
      },
      {
        connection: this.redis,
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Queue job failed: ${job?.id ?? 'unknown'}`, error.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
    await this.redis?.quit();
  }

  async enqueueAction(dto: ActionDto, requestUser?: RequestUser): Promise<{ accepted: boolean }> {
    if (!dto.sessionId || dto.sessionId.trim().length === 0) {
      throw new BadRequestException('sessionId la bat buoc');
    }

    if (dto.foodId && !isValidObjectId(dto.foodId)) {
      throw new BadRequestException('foodId khong hop le');
    }

    const payload: StoredAction = {
      userId: requestUser?.userId ?? dto.userId,
      sessionId: dto.sessionId,
      foodId: dto.foodId,
      actionType: dto.actionType,
      context: dto.context,
      triggerType: dto.triggerType,
      filterSnapshot: dto.filterSnapshot ?? {},
      deviceType: dto.deviceType,
      sessionDurationMs: dto.sessionDurationMs,
    };

    if (!this.queue) {
      await this.persistAction(payload);
      return { accepted: true };
    }

    try {
      await this.queue.add('log-action', payload, {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 500,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Queue add failed, writing action directly to MongoDB: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await this.persistAction(payload);
    }

    return { accepted: true };
  }

  async addFavorite(
    userId: string,
    dto: FavoriteDto,
    sessionId?: string,
    deviceType: 'mobile' | 'web' = 'web',
  ): Promise<unknown> {
    if (!isValidObjectId(userId) || !isValidObjectId(dto.foodId)) {
      throw new BadRequestException('Id khong hop le');
    }

    try {
      const created = await this.favoriteModel.create({
        userId: new Types.ObjectId(userId),
        foodId: new Types.ObjectId(dto.foodId),
        listType: dto.listType,
        addedAt: new Date(),
      });

      void this.enqueueAction(
        {
          sessionId: this.resolveSessionId(sessionId, userId),
          foodId: dto.foodId,
          actionType: 'favorite_add',
          context: 'none',
          filterSnapshot: {},
          deviceType,
        },
        { userId, email: '', role: 'user' },
      ).catch((error: unknown) =>
        this.logger.warn(`Unable to enqueue favorite_add: ${String(error)}`),
      );

      return created.toObject();
    } catch (error: unknown) {
      if (this.isMongoDuplicate(error)) {
        throw new ConflictException('Mon an da ton tai trong danh sach');
      }
      throw error;
    }
  }

  async getFavorites(userId: string, listType?: string): Promise<unknown[]> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException('User id khong hop le');
    }

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    if (listType) {
      query['listType'] = listType;
    }

    return this.favoriteModel.find(query).sort({ addedAt: -1 }).lean().exec();
  }

  async removeFavorite(
    userId: string,
    favoriteId: string,
    sessionId?: string,
    deviceType: 'mobile' | 'web' = 'web',
  ): Promise<{ deleted: boolean }> {
    if (!isValidObjectId(userId) || !isValidObjectId(favoriteId)) {
      throw new BadRequestException('Id khong hop le');
    }

    const deleted = await this.favoriteModel
      .findOneAndDelete({ _id: favoriteId, userId: new Types.ObjectId(userId) })
      .lean()
      .exec();

    if (!deleted) {
      throw new NotFoundException('Khong tim thay favorite');
    }

    if (deleted.foodId) {
      void this.enqueueAction(
        {
          sessionId: this.resolveSessionId(sessionId, userId),
          foodId: String(deleted.foodId),
          actionType: 'favorite_remove',
          context: 'none',
          filterSnapshot: {},
          deviceType,
        },
        { userId, email: '', role: 'user' },
      ).catch((error: unknown) =>
        this.logger.warn(`Unable to enqueue favorite_remove: ${String(error)}`),
      );
    }

    return { deleted: true };
  }

  async addReview(
    userId: string,
    dto: ReviewDto,
    sessionId?: string,
    deviceType: 'mobile' | 'web' = 'web',
  ): Promise<unknown> {
    if (!isValidObjectId(userId) || !isValidObjectId(dto.foodId)) {
      throw new BadRequestException('Id khong hop le');
    }

    try {
      const created = await this.reviewModel.create({
        userId: new Types.ObjectId(userId),
        foodId: new Types.ObjectId(dto.foodId),
        rating: dto.rating,
        comment: dto.comment,
        images: dto.images ?? [],
      });

      await this.refreshFoodRating(dto.foodId);

      void this.enqueueAction(
        {
          sessionId: this.resolveSessionId(sessionId, userId),
          foodId: dto.foodId,
          actionType: 'review_submit',
          context: 'none',
          filterSnapshot: {},
          deviceType,
        },
        { userId, email: '', role: 'user' },
      ).catch((error: unknown) =>
        this.logger.warn(`Unable to enqueue review_submit: ${String(error)}`),
      );

      return created.toObject();
    } catch (error: unknown) {
      if (this.isMongoDuplicate(error)) {
        throw new ConflictException('Ban da danh gia mon an nay roi');
      }
      throw error;
    }
  }

  async getReviews(foodId: string): Promise<unknown[]> {
    if (!isValidObjectId(foodId)) {
      throw new BadRequestException('foodId khong hop le');
    }

    return this.reviewModel
      .find({ foodId: new Types.ObjectId(foodId), isHidden: false })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto): Promise<unknown> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException('User id khong hop le');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.dietPreferences?.type) {
      updateData['dietPreferences.type'] = dto.dietPreferences.type;
    }

    if (dto.dietPreferences?.allergies) {
      updateData['dietPreferences.allergies'] = dto.dietPreferences.allergies;
    } else if (dto.allergies) {
      updateData['dietPreferences.allergies'] = dto.allergies;
    }

    const updated = await this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Khong tim thay nguoi dung');
    }

    return updated;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshPopularityScore(): Promise<void> {
    const aggregates = await this.actionModel
      .aggregate<{
        _id: Types.ObjectId;
        swipeRight: number;
        viewDetail: number;
        favoriteAdd: number;
        reviewSubmit: number;
      }>([
        {
          $match: {
            foodId: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$foodId',
            swipeRight: {
              $sum: {
                $cond: [{ $eq: ['$actionType', 'swipe_right'] }, 1, 0],
              },
            },
            viewDetail: {
              $sum: {
                $cond: [{ $eq: ['$actionType', 'view_detail'] }, 1, 0],
              },
            },
            favoriteAdd: {
              $sum: {
                $cond: [{ $eq: ['$actionType', 'favorite_add'] }, 1, 0],
              },
            },
            reviewSubmit: {
              $sum: {
                $cond: [{ $eq: ['$actionType', 'review_submit'] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    await this.foodModel.updateMany({}, { popularityScore: 0 }).exec();

    if (aggregates.length === 0) {
      return;
    }

    const ops = aggregates.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: {
          popularityScore: computePopularityScore({
            swipeRight: item.swipeRight,
            viewDetail: item.viewDetail,
            favoriteAdd: item.favoriteAdd,
            reviewSubmit: item.reviewSubmit,
          }),
        },
      },
    }));

    await this.foodModel.bulkWrite(ops);
  }

  private async persistAction(payload: StoredAction): Promise<void> {
    await this.actionModel.create({
      userId:
        payload.userId && isValidObjectId(payload.userId)
          ? new Types.ObjectId(payload.userId)
          : null,
      sessionId: payload.sessionId,
      foodId:
        payload.foodId && isValidObjectId(payload.foodId)
          ? new Types.ObjectId(payload.foodId)
          : null,
      actionType: payload.actionType,
      context: payload.context,
      triggerType: payload.triggerType,
      filterSnapshot: payload.filterSnapshot ?? {},
      deviceType: payload.deviceType,
      sessionDurationMs: payload.sessionDurationMs,
    });
  }

  private async refreshFoodRating(foodId: string): Promise<void> {
    const summary = await this.reviewModel
      .aggregate<{ _id: Types.ObjectId; avgRating: number; totalReviews: number }>([
        {
          $match: {
            foodId: new Types.ObjectId(foodId),
            isHidden: false,
          },
        },
        {
          $group: {
            _id: '$foodId',
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ])
      .exec();

    const first = summary[0];
    await this.foodModel
      .findByIdAndUpdate(foodId, {
        averageRating: first ? Number(first.avgRating.toFixed(2)) : 0,
        totalReviews: first?.totalReviews ?? 0,
      })
      .exec();
  }

  private isRedisUrl(value: string): boolean {
    return /^rediss?:\/\//i.test(value);
  }

  private resolveSessionId(sessionId: string | undefined, userId: string): string {
    if (sessionId && sessionId.trim().length > 0) {
      return sessionId;
    }

    return `user-${userId}`;
  }

  private isMongoDuplicate(error: unknown): boolean {
    if (typeof error !== 'object' || !error) {
      return false;
    }

    const candidate = error as { code?: number };
    return candidate.code === 11000;
  }
}
