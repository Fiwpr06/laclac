import { IsBoolean, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: ['vi', 'en'] })
  @IsOptional()
  @IsEnum(['vi', 'en'])
  language?: 'vi' | 'en';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hapticEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reduceMotion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  disableConfetti?: boolean;

  @ApiPropertyOptional({ minimum: 0.8, maximum: 1.5 })
  @IsOptional()
  @IsNumber()
  @Min(0.8)
  @Max(1.5)
  textScale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  swipeModeEnabled?: boolean;
}
