import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadDto {
  @ApiPropertyOptional({ description: 'Public image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Base64 image string' })
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @ApiPropertyOptional({ description: 'Dish name or custom asset name for Cloudinary public_id' })
  @IsOptional()
  @IsString()
  assetName?: string;
}
