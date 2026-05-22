import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const PRICE_RANGES = ['cheap', 'medium', 'expensive'] as const;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const DIET_TAGS = ['vegetarian', 'vegan', 'keto', 'clean'] as const;
const COOKING_STYLES = ['soup', 'dry', 'fried', 'grilled', 'raw', 'steamed'] as const;
const CONTEXT_VALUES = ['solo', 'date', 'group', 'travel', 'office'] as const;

class NutritionInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  protein?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  carbs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fiber?: number;
}

class LocalizedTextDto {
  @ApiProperty()
  @IsString()
  vi!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  en?: string;
}

class LocalizedArrayDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  vi!: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  en?: string[];
}

class RecipeDto {
  @ApiProperty({ type: LocalizedArrayDto })
  @ValidateNested()
  @Type(() => LocalizedArrayDto)
  steps!: LocalizedArrayDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prepTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cookTimeMinutes?: number;

  @ApiPropertyOptional({ enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}


export class CreateFoodDto {
  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description?: LocalizedTextDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ enum: MEAL_TYPES, isArray: true })
  @IsArray()
  @IsEnum(MEAL_TYPES, { each: true })
  mealTypes!: Array<(typeof MEAL_TYPES)[number]>;

  @ApiProperty({ enum: PRICE_RANGES })
  @IsEnum(PRICE_RANGES)
  priceRange!: (typeof PRICE_RANGES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ enum: COOKING_STYLES })
  @IsOptional()
  @IsEnum(COOKING_STYLES)
  cookingStyle?: (typeof COOKING_STYLES)[number];

  @ApiPropertyOptional({ enum: DIET_TAGS, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(DIET_TAGS, { each: true })
  dietTags?: Array<(typeof DIET_TAGS)[number]>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @ApiPropertyOptional({ type: RecipeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecipeDto)
  recipe?: RecipeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  caloriesPerServing?: number;

  @ApiPropertyOptional({ type: LocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  servingSize?: LocalizedTextDto;

  @ApiPropertyOptional({ type: NutritionInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionInfoDto)
  nutritionInfo?: NutritionInfoDto;

  @ApiProperty({ type: LocalizedArrayDto })
  @ValidateNested()
  @Type(() => LocalizedArrayDto)
  ingredients!: LocalizedArrayDto;

  @ApiPropertyOptional({ type: LocalizedArrayDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedArrayDto)
  tags?: LocalizedArrayDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ enum: CONTEXT_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CONTEXT_VALUES, { each: true })
  contextTags?: Array<(typeof CONTEXT_VALUES)[number]>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}
