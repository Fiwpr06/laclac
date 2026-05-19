import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FoodDocument = HydratedDocument<Food>;

@Schema({ _id: false })
export class NutritionInfo {
  @Prop({ min: 0 })
  protein?: number;

  @Prop({ min: 0 })
  carbs?: number;

  @Prop({ min: 0 })
  fat?: number;

  @Prop({ min: 0 })
  fiber?: number;
}

@Schema({ timestamps: true, collection: 'foods' })
export class Food {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true })
  nameSlug!: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop()
  thumbnailImage?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category?: Types.ObjectId;

  @Prop({
    type: [String],
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: [],
  })
  mealTypes!: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'>;

  @Prop({ type: String, enum: ['cheap', 'medium', 'expensive'], required: true })
  priceRange!: 'cheap' | 'medium' | 'expensive';

  @Prop({ min: 0 })
  priceMin?: number;

  @Prop({ min: 0 })
  priceMax?: number;

  @Prop({ type: String, enum: ['soup', 'dry', 'fried', 'grilled', 'raw', 'steamed'] })
  cookingStyle?: 'soup' | 'dry' | 'fried' | 'grilled' | 'raw' | 'steamed';

  @Prop({ type: [String], enum: ['vegetarian', 'vegan', 'keto', 'clean'], default: [] })
  dietTags!: Array<'vegetarian' | 'vegan' | 'keto' | 'clean'>;

  @Prop({ type: [String], default: [] })
  allergens!: string[];

  @Prop({ min: 0 })
  calories?: number;

  @Prop({ type: NutritionInfo })
  nutritionInfo?: NutritionInfo;

  @Prop({ type: [String], required: true, default: [] })
  ingredients!: string[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop()
  origin?: string;

  @Prop({ type: [String], enum: ['solo', 'date', 'group', 'travel', 'office'], default: [] })
  contextTags!: Array<'solo' | 'date' | 'group' | 'travel' | 'office'>;

  @Prop({ default: 0 })
  popularityScore!: number;

  @Prop({ default: 0 })
  averageRating!: number;

  @Prop({ default: 0 })
  totalReviews!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const FoodSchema = SchemaFactory.createForClass(Food);

FoodSchema.index({ isActive: 1, popularityScore: -1, averageRating: -1 });
FoodSchema.index({ isActive: 1, contextTags: 1 });
FoodSchema.index({ isActive: 1, dietTags: 1, priceRange: 1 });
FoodSchema.index({ _id: 1, isActive: 1 });
