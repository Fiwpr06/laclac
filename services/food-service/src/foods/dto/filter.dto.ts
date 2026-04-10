import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const PRICE_RANGES = ['cheap', 'medium', 'expensive'] as const;
const BUDGET_BUCKETS = ['under_30k', 'from_30k_to_50k', 'from_50k_to_100k', 'over_100k'] as const;
const DISH_TYPES = ['liquid', 'dry', 'fried_grilled'] as const;
const CUISINE_TYPES = ['vietnamese', 'asian', 'european'] as const;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const DIET_TAGS = ['vegetarian', 'vegan', 'keto', 'clean'] as const;
const COOKING_STYLES = ['soup', 'dry', 'fried', 'grilled', 'raw', 'steamed'] as const;
const CONTEXT_VALUES = ['solo', 'date', 'group', 'travel', 'office'] as const;

export class FilterDto {
  @ApiPropertyOptional({ enum: PRICE_RANGES })
  @IsOptional()
  @IsEnum(PRICE_RANGES)
  priceRange?: (typeof PRICE_RANGES)[number];

  @ApiPropertyOptional({ enum: BUDGET_BUCKETS })
  @IsOptional()
  @IsEnum(BUDGET_BUCKETS)
  budgetBucket?: (typeof BUDGET_BUCKETS)[number];

  @ApiPropertyOptional({ enum: DISH_TYPES })
  @IsOptional()
  @IsEnum(DISH_TYPES)
  dishType?: (typeof DISH_TYPES)[number];

  @ApiPropertyOptional({ enum: CUISINE_TYPES })
  @IsOptional()
  @IsEnum(CUISINE_TYPES)
  cuisineType?: (typeof CUISINE_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: MEAL_TYPES })
  @IsOptional()
  @IsEnum(MEAL_TYPES)
  mealType?: (typeof MEAL_TYPES)[number];

  @ApiPropertyOptional({ enum: DIET_TAGS })
  @IsOptional()
  @IsEnum(DIET_TAGS)
  dietTag?: (typeof DIET_TAGS)[number];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',').map((v) => v.trim());
    }
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  allergenExclude?: string[];

  @ApiPropertyOptional({ enum: COOKING_STYLES })
  @IsOptional()
  @IsEnum(COOKING_STYLES)
  cookingStyle?: (typeof COOKING_STYLES)[number];

  @ApiPropertyOptional({ enum: CONTEXT_VALUES })
  @IsOptional()
  @IsEnum(CONTEXT_VALUES)
  context?: (typeof CONTEXT_VALUES)[number];
}

export class FoodsQueryDto extends FilterDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ example: '-createdAt' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class ContextRequestDto {
  @ApiPropertyOptional({ enum: CONTEXT_VALUES })
  @IsEnum(CONTEXT_VALUES)
  context!: (typeof CONTEXT_VALUES)[number];

  @ApiPropertyOptional({ type: FilterDto })
  @IsOptional()
  filters?: FilterDto;
}
