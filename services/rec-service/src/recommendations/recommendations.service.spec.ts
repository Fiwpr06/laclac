import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  it('should return empty array for placeholder recommendations', () => {
    const service = new RecommendationsService({} as never);
    expect(service.getPlaceholderRecommendations()).toEqual([]);
  });
});
