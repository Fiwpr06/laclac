import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

import { UploadDto } from './dto/upload.dto';

const REMOTE_IMAGE_TIMEOUT_MS = 15_000;
const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;

@Injectable()
export class MediaService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private extractImageUrlFromHtml(html: string, pageUrl: URL): string | undefined {
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["'][^>]*>/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["'][^>]*>/i,
      /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      const candidate = match?.[1]?.trim();
      if (!candidate) {
        continue;
      }

      try {
        const resolvedUrl = new URL(candidate, pageUrl).toString();
        const protocol = new URL(resolvedUrl).protocol;
        if (protocol === 'http:' || protocol === 'https:') {
          return resolvedUrl;
        }
      } catch {
        continue;
      }
    }

    return undefined;
  }

  private async fetchImageAsDataUrl(imageUrl: string, depth: number = 0): Promise<string> {
    if (depth > 2) {
      throw new BadRequestException('Không thể tìm thấy ảnh hợp lệ từ URL đã cung cấp');
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      throw new BadRequestException('imageUrl không hợp lệ');
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('imageUrl phải bắt đầu bằng http hoặc https');
    }

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(REMOTE_IMAGE_TIMEOUT_MS),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new BadRequestException('Hết thời gian tải ảnh từ URL');
      }

      throw new BadRequestException('Không thể tải ảnh từ URL');
    }

    if (!response.ok) {
      throw new BadRequestException(`Không thể tải ảnh từ URL (HTTP ${response.status})`);
    }

    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();

    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      const extractedImageUrl = this.extractImageUrlFromHtml(html, parsedUrl);
      if (!extractedImageUrl) {
        throw new BadRequestException('Link không chứa ảnh hợp lệ để upload');
      }

      return this.fetchImageAsDataUrl(extractedImageUrl, depth + 1);
    }

    if (!contentType || !contentType.startsWith('image/')) {
      throw new BadRequestException('URL không trả về dữ liệu ảnh hợp lệ');
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0) {
      throw new BadRequestException('Ảnh từ URL trống hoặc không đọc được');
    }

    if (bytes.length > MAX_REMOTE_IMAGE_BYTES) {
      throw new BadRequestException('Ảnh quá lớn, vui lòng dùng ảnh nhỏ hơn 10MB');
    }

    return `data:${contentType};base64,${bytes.toString('base64')}`;
  }

  private toCloudinaryPublicId(assetName?: string): string | undefined {
    if (!assetName) {
      return undefined;
    }

    const normalized = assetName
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9\s/_-]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);

    return normalized || undefined;
  }

  async upload(dto: UploadDto): Promise<{ url: string; provider: string }> {
    if (!dto.imageUrl && !dto.imageBase64) {
      throw new BadRequestException('Cần imageUrl hoặc imageBase64');
    }

    const hasCloudinaryConfig =
      !!this.configService.get<string>('CLOUDINARY_CLOUD_NAME') &&
      !!this.configService.get<string>('CLOUDINARY_API_KEY') &&
      !!this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!hasCloudinaryConfig) {
      return {
        url: dto.imageUrl ?? (dto.imageBase64 as string),
        provider: 'mock',
      };
    }

    const publicId = this.toCloudinaryPublicId(dto.assetName);

    const buildUploadOptions = (id?: string) => ({
      folder: 'lac-lac',
      ...(id
        ? {
            public_id: id,
            overwrite: true,
            invalidate: true,
            unique_filename: false,
            use_filename: false,
          }
        : {}),
      format: 'webp',
      resource_type: 'image' as const,
    });

    let uploaded: { secure_url: string };
    try {
      if (dto.imageBase64) {
        uploaded = await cloudinary.uploader.upload(dto.imageBase64, buildUploadOptions(publicId));
      } else {
        const sourceUrl = dto.imageUrl as string;
        try {
          // Prefer Cloudinary remote fetch first to avoid local HTTP rate limiting.
          uploaded = await cloudinary.uploader.upload(sourceUrl, buildUploadOptions(publicId));
        } catch {
          const payload = await this.fetchImageAsDataUrl(sourceUrl);
          uploaded = await cloudinary.uploader.upload(payload, buildUploadOptions(publicId));
        }
      }
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Unknown error';
      throw new BadRequestException(`Không thể upload ảnh lên Cloudinary: ${message}`);
    }

    return {
      url: uploaded.secure_url,
      provider: 'cloudinary',
    };
  }
}
