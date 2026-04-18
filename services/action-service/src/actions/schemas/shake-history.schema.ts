import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShakeHistoryDocument = HydratedDocument<ShakeHistory>;

@Schema({ timestamps: true, collection: 'shake_history' })
export class ShakeHistory {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  foodId!: Types.ObjectId;

  @Prop({ required: true })
  foodName!: string;

  @Prop({ type: String, default: null })
  foodImage?: string | null;

  @Prop({ type: String, default: null })
  priceRange?: string | null;

  @Prop({ type: String, default: null })
  origin?: string | null;
}

export const ShakeHistorySchema = SchemaFactory.createForClass(ShakeHistory);
ShakeHistorySchema.index({ userId: 1, createdAt: -1 });
