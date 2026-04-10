import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

const CATEGORY_TYPES = ['cuisine', 'meal_type', 'diet'] as const;

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: CATEGORY_TYPES })
  @IsEnum(CATEGORY_TYPES)
  type!: (typeof CATEGORY_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
