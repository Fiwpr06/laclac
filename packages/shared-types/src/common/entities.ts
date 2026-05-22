import {
  ActionType,
  BudgetBucket,
  CategoryType,
  ContextTag,
  CookingStyle,
  CuisineType,
  DeviceType,
  DietType,
  DishType,
  FavoriteListType,
  MealType,
  PriceRange,
  ShakeTriggerType,
  UserRole,
} from './enums';

export interface LocalizedString {
  vi: string;
  en: string;
}

export interface LocalizedArray {
  vi: string[];
  en: string[];
}

export interface DietPreferences {
  type: DietType;
  allergies: string[];
}

export interface UserSettings {
  swipeModeEnabled: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  dietPreferences: DietPreferences;
  settings?: UserSettings;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionInfo {
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface Recipe {
  steps: LocalizedArray;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Food {
  _id: string;
  name: LocalizedString;
  nameSlug: string;
  description?: LocalizedString;
  images: string[];
  thumbnailImage?: string;
  category?: string;
  mealTypes: MealType[];
  priceRange: PriceRange;
  priceMin?: number;
  priceMax?: number;
  cookingStyle?: CookingStyle;
  dietTags: Exclude<DietType, 'normal'>[];
  allergens: string[];
  recipe?: Recipe;
  calories?: number;
  caloriesPerServing?: number;
  servingSize?: LocalizedString;
  nutritionInfo?: NutritionInfo;
  ingredients: LocalizedArray;
  tags: LocalizedArray;
  origin?: string;
  contextTags: ContextTag[];
  popularityScore: number;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Review {
  _id: string;
  userId: string;
  foodId: string;
  rating: number;
  comment?: string;
  images: string[];
  isHidden: boolean;
  createdAt: string;
}

export interface Favorite {
  _id: string;
  userId: string;
  foodId: string;
  listType: FavoriteListType;
  addedAt: string;
}

export interface FilterSnapshot {
  priceRange?: PriceRange;
  budgetBucket?: BudgetBucket;
  dishType?: DishType;
  cuisineType?: CuisineType;
  mealType?: MealType;
  dietTag?: Exclude<DietType, 'normal'>;
  category?: string;
}

export interface UserAction {
  _id: string;
  userId?: string;
  sessionId: string;
  foodId?: string;
  actionType: ActionType;
  context: ContextTag | 'none';
  triggerType?: ShakeTriggerType;
  filterSnapshot: FilterSnapshot;
  deviceType: DeviceType;
  sessionDurationMs?: number;
  createdAt: string;
}
