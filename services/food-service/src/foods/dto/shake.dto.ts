import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { FilterDto } from './filter.dto';

const TRIGGER_TYPES = ['shake', 'button'] as const;
const DEVICE_TYPES = ['mobile', 'web'] as const;
const CONTEXT_VALUES = ['solo', 'date', 'group', 'travel', 'office'] as const;

export class ShakeRequestDto {
  @ApiProperty({ example: 'd7ec4f6f-932e-4d56-8ee4-f95f9bf24277' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({ enum: TRIGGER_TYPES, default: 'button' })
  @IsEnum(TRIGGER_TYPES)
  triggerType!: (typeof TRIGGER_TYPES)[number];

  @ApiProperty({ enum: DEVICE_TYPES, default: 'mobile' })
  @IsEnum(DEVICE_TYPES)
  deviceType!: (typeof DEVICE_TYPES)[number];

  @ApiPropertyOptional({ enum: CONTEXT_VALUES })
  @IsOptional()
  @IsEnum(CONTEXT_VALUES)
  context?: (typeof CONTEXT_VALUES)[number];

  @ApiPropertyOptional({ type: FilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterDto)
  filters?: FilterDto;
}
