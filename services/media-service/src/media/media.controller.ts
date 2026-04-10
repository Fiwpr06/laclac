import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UploadDto } from './dto/upload.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload ảnh lên Cloudinary' })
  async upload(@Body() dto: UploadDto) {
    const data = await this.mediaService.upload(dto);
    return { success: true, data, message: 'Upload thành công' };
  }
}
