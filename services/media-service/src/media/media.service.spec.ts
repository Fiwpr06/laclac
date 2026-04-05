import { ConfigService } from '@nestjs/config';

import { MediaService } from './media.service';

describe('MediaService', () => {
  it('should return mock provider without cloudinary config', async () => {
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;

    const service = new MediaService(config);
    const result = await service.upload({ imageUrl: 'https://example.com/image.jpg' });

    expect(result.provider).toBe('mock');
    expect(result.url).toContain('https://example.com');
  });
});
