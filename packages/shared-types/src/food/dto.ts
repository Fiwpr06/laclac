import {
  BudgetBucket,
  ContextTag,
  CookingStyle,
  CuisineType,
  DeviceType,
  DietType,
  DishType,
  MealType,
  PriceRange,
  ShakeTriggerType,
} from '../common/enums';
import { NutritionInfo, Recipe } from '../common/entities';

export interface FilterDto {
  priceRange?: PriceRange;
  category?: string;
  mealType?: MealType;
  dietTag?: Exclude<DietType, 'normal'>;
  allergenExclude?: string[];
  cookingStyle?: CookingStyle;
  context?: ContextTag;
  maxCalories?: number;
  minCalories?: number;
  difficulty?: string[];
  maxPrepTime?: number;
  origin?: string[];
  allergensFree?: string[];
}

export interface ShakeFilterDto extends FilterDto {
  budgetBucket?: BudgetBucket;
  dishType?: DishType;
  cuisineType?: CuisineType;
}

export interface ShakeRequestDto {
  sessionId: string;
  triggerType: ShakeTriggerType;
  deviceType: DeviceType;
  context?: ContextTag;
  filters?: ShakeFilterDto;
}

export interface ShakeActionHintDto {
  sessionId: string;
  foodId?: string;
  actionType: 'shake_result';
  context: ContextTag | 'none';
  triggerType: ShakeTriggerType;
  filterSnapshot: ShakeFilterDto;
  deviceType: DeviceType;
}

export interface ShakeResponseDto<TFood = unknown> {
  sessionId: string;
  triggerType: ShakeTriggerType;
  food: TFood | null;
  actionHint: ShakeActionHintDto;
}

export interface ContextFilterDto {
  context: ContextTag;
  filters?: FilterDto;
}

export interface CreateFoodDto {
  name: string;
  description?: string;
  images?: string[];
  thumbnailImage?: string;
  category?: string;
  mealTypes: MealType[];
  priceRange: PriceRange;
  priceMin?: number;
  priceMax?: number;
  cookingStyle?: CookingStyle;
  dietTags?: Exclude<DietType, 'normal'>[];
  allergens?: string[];
  recipe?: Recipe;
  calories?: number;
  caloriesPerServing?: number;
  servingSize?: string;
  nutritionInfo?: NutritionInfo;
  ingredients: string[];
  tags?: string[];
  origin?: string;
  contextTags?: ContextTag[];
  isActive?: boolean;
}

export type UpdateFoodDto = Partial<CreateFoodDto>;
