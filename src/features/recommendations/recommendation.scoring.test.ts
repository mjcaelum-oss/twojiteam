import { describe, expect, it } from 'vitest';
import { getRecommendations } from './recommendation.scoring';
import type { Spot } from '../../types/spot';

const spots: Spot[] = ['museum', 'park', 'cafe', 'far'].map((id, index) => ({ id, name: id, region: '서울', latitude: 37.5 + index * .01, longitude: 126.9, category: id === 'museum' ? 'culture' : 'nature', tags: id === 'museum' ? ['culture', 'couple'] : ['nature'], description: '', feeAmount: 0, feeNote: '', durationMinutes: 90, openingHours: { weekly: {} }, popularity: .8, source: 'places' }));

describe('getRecommendations', () => {
  const context = { destination: { name: '서울', latitude: 37.5665, longitude: 126.978 }, preferences: { style: 'culture' as const, pace: 'slow' as const, companion: 'couple' as const }, selectedIds: [], rejectedIds: [] };
  it('returns at most three candidates and prioritizes matching style', () => {
    const result = getRecommendations(spots, context);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result[0].tags).toContain('culture');
  });
  it('does not return selected or rejected spots', () => {
    const result = getRecommendations(spots, { ...context, selectedIds: ['seoul-gyeongbokgung'], rejectedIds: ['seoul-bukchon'] });
    expect(result.some((spot) => ['seoul-gyeongbokgung', 'seoul-bukchon'].includes(spot.id))).toBe(false);
  });

  it('prioritizes the selected food preference by category', () => {
    const result = getRecommendations(spots.map((spot) => spot.id === 'cafe' ? { ...spot, category: 'food', tags: ['food'] } : spot), { ...context, preferences: { ...context.preferences, style: 'food' } });
    expect(result[0].category).toBe('food');
  });
  it('skips an immediately repeated restaurant but keeps cafes eligible', () => {
    const foodSpots = [
      { ...spots[2], id: 'restaurant', venueType: 'restaurant' as const, category: 'food' as const, tags: ['food'] },
      { ...spots[2], id: 'cafe-2', venueType: 'cafe' as const, category: 'food' as const, tags: ['food'] }
    ];
    const result = getRecommendations(foodSpots, { ...context, previous: foodSpots[0] });
    expect(result.some((spot) => spot.venueType === 'restaurant')).toBe(false);
    expect(result.some((spot) => spot.venueType === 'cafe')).toBe(true);
  });
});
