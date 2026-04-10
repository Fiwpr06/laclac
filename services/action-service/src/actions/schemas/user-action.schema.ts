import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserActionDocument = HydratedDocument<UserAction>;

@Schema({ _id: false })
class FilterSnapshot {
  @Prop()
  priceRange?: string;

  @Prop()
  budgetBucket?: string;

  @Prop()
  dishType?: string;

  @Prop()
  cuisineType?: string;

  @Prop()
  mealType?: string;

  @Prop()
  dietTag?: string;

  @Prop()
  category?: string;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'user_actions' })
export class UserAction {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: true })
  sessionId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Food', default: null })
  foodId?: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: [
      'swipe_right',
      'swipe_left',
      'view_detail',
      'shake_result',
      'favorite_add',
      'favorite_remove',
      'review_submit',
    ],
    required: true,
  })
  actionType!:
    | 'swipe_right'
    | 'swipe_left'
    | 'view_detail'
    | 'shake_result'
    | 'favorite_add'
    | 'favorite_remove'
    | 'review_submit';

  @Prop({
    type: String,
    enum: ['solo', 'date', 'group', 'travel', 'office', 'none'],
    default: 'none',
  })
  context!: 'solo' | 'date' | 'group' | 'travel' | 'office' | 'none';

  @Prop({ type: String, enum: ['shake', 'button'] })
  triggerType?: 'shake' | 'button';

  @Prop({ type: FilterSnapshot, default: {} })
  filterSnapshot!: FilterSnapshot;

  @Prop({ type: String, enum: ['mobile', 'web'], required: true })
  deviceType!: 'mobile' | 'web';

  @Prop({ min: 0 })
  sessionDurationMs?: number;

  createdAt!: Date;
}

export const UserActionSchema = SchemaFactory.createForClass(UserAction);
UserActionSchema.index({ userId: 1, createdAt: -1 });
UserActionSchema.index({ foodId: 1, actionType: 1 });
