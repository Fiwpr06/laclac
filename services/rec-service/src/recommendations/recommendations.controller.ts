import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @Header('X-Rec-Mode', 'rule-based')
  @ApiOperation({ summary: 'Placeholder recommendation endpoint' })
  getRecommendations() {
    const data = this.recommendationsService.getPlaceholderRecommendations();
    return { success: true, data };
  }

  @Get('trending')
  @Header('X-Rec-Mode', 'rule-based')
  @ApiOperation({ summary: 'Lay danh sach trending theo popularityScore' })
  async getTrending(@Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Math.max(1, Math.min(50, Number(limitRaw) || 10)) : 10;
    const data = await this.recommendationsService.getTrending(limit);
    return { success: true, data };
  }
}
