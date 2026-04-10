import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const ACTION_TYPES = [
  'swipe_right',
  'swipe_left',
  'view_detail',
  'shake_result',
  'favorite_add',
  'favorite_remove',
  'review_submit',
] as const;

const CONTEXTS = ['solo', 'date', 'group', 'travel', 'office', 'none'] as const;
const DEVICES = ['mobile', 'web'] as const;
const TRIGGER_TYPES = ['shake', 'button'] as const;

class FilterSnapshotDto {
  @ApiPropertyOptional({ enum: ['cheap', 'medium', 'expensive'] })
  @IsOptional()
  @IsString()
  priceRange?: string;

  @ApiPropertyOptional({ enum: ['under_30k', 'from_30k_to_50k', 'from_50k_to_100k', 'over_100k'] })
  @IsOptional()
  @IsString()
  budgetBucket?: string;

  @ApiPropertyOptional({ enum: ['liquid', 'dry', 'fried_grilled'] })
  @IsOptional()
  @IsString()
  dishType?: string;

  @ApiPropertyOptional({ enum: ['vietnamese', 'asian', 'european'] })
  @IsOptional()
  @IsString()
  cuisineType?: string;

  @ApiPropertyOptional({ enum: ['breakfast', 'lunch', 'dinner', 'snack'] })
  @IsOptional()
  @IsString()
  mealType?: string;

  @ApiPropertyOptional({ enum: ['vegetarian', 'vegan', 'keto', 'clean'] })
  @IsOptional()
  @IsString()
  dietTag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class ActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'uuid-v4-session-id' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  foodId?: string;

  @ApiProperty({ enum: ACTION_TYPES })
  @IsEnum(ACTION_TYPES)
  actionType!: (typeof ACTION_TYPES)[number];

  @ApiProperty({ enum: CONTEXTS, default: 'none' })
  @IsEnum(CONTEXTS)
  context!: (typeof CONTEXTS)[number];

  @ApiPropertyOptional({ enum: TRIGGER_TYPES })
  @IsOptional()
  @IsEnum(TRIGGER_TYPES)
  triggerType?: (typeof TRIGGER_TYPES)[number];

  @ApiPropertyOptional({ type: FilterSnapshotDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterSnapshotDto)
  filterSnapshot?: FilterSnapshotDto;

  @ApiProperty({ enum: DEVICES })
  @IsEnum(DEVICES)
  deviceType!: (typeof DEVICES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sessionDurationMs?: number;
}
