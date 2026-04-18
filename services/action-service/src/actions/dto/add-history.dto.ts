import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddHistoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  foodId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  foodName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  foodImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priceRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  origin?: string;
}
