import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { UploadDto } from './dto/upload.dto';

@Injectable()
export class MediaService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(dto: UploadDto): Promise<{ url: string; provider: string }> {
    const payload = dto.imageUrl ?? dto.imageBase64;
    if (!payload) {
      throw new BadRequestException('Can imageUrl hoac imageBase64');
    }

    const hasCloudinaryConfig =
      !!this.configService.get<string>('CLOUDINARY_CLOUD_NAME') &&
      !!this.configService.get<string>('CLOUDINARY_API_KEY') &&
      !!this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!hasCloudinaryConfig) {
      return {
        url: dto.imageUrl ?? `data:image/jpeg;base64,${dto.imageBase64?.slice(0, 32) ?? ''}...`,
        provider: 'mock',
      };
    }

    const uploaded = await cloudinary.uploader.upload(payload, {
      folder: 'lac-lac',
      format: 'webp',
      resource_type: 'image',
    });

    return {
      url: uploaded.secure_url,
      provider: 'cloudinary',
    };
  }
}
