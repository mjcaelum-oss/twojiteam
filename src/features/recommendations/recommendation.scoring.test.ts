import { describe, expect, it } from 'vitest';
import { getRecommendations } from './recommendation.scoring';
import type { Spot } from '../../types/spot';

const spots: Spot[] = ['museum', 'park', 'cafe', 'far'].map((id, index) => ({ id, name: id, region: '서울', latitude: 37.5 + index * .01, longitude: 126.9, category: id === 'museum' ? 'culture' : 'nature', tags: id === 'museum' ? ['culture', 'couple'] : ['nature'], description: '', feeAmount: 0, feeNote: '', durationMinutes: 90, openingHours: { weekly: {} }, popularity: .8, source: 'places' }));

describe('getRecommendations', () => {
  const context = { destination: { name: '서울', latitude: 37.5665, longitude: 126.978 }, preferences: { style: 'culture' as const, pace: 'slow' as const, companion: 'couple' as const }, selectedIds: [], rejectedIds: [] };
  it('returns at most three candidates and prioritizes matching style', () => {
    const result = getRecommendations(spots, context);
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0].tags).toContain('culture');
  });
  it('does not return selected or rejected spots', () => {
    const result = getRecommendations(spots, { ...context, selectedIds: ['seoul-gyeongbokgung'], rejectedIds: ['seoul-bukchon'] });
    expect(result.some((spot) => ['seoul-gyeongbokgung', 'seoul-bukchon'].includes(spot.id))).toBe(false);
  });
});
