import { describe, expect, it } from 'vitest';
import { getItineraryTotals } from './itinerary.service';

const spot = (feeAmount: number) => ({
  id: String(feeAmount), name: 'spot', region: '서울', latitude: 37.5, longitude: 127, category: 'culture' as const,
  tags: [], description: '', feeAmount, feeNote: '', durationMinutes: 90, openingHours: { weekly: {} }, popularity: 1, source: 'places' as const,
});

describe('itinerary totals', () => {
  it('includes entrance fees and route costs', () => {
    const result = getItineraryTotals({
      id: 'plan', title: 'plan', destination: { name: '서울', latitude: 37.5, longitude: 127 }, travelDate: '2026-07-15', startTime: '09:00',
      preferences: { style: 'culture', pace: 'balanced', companion: 'solo' }, partySize: 2,
      spots: [{ spot: spot(3000), visitOrder: 1 }], routes: [{ durationMinutes: 20, distanceMeters: 1000, cost: 1500, costCurrency: 'KRW' }], status: 'draft',
    });
    expect(result.estimatedCost).toBe(7500);
    expect(result.currency).toBe('KRW');
  });

  it('uses the plan currency for foreign trips', () => {
    const result = getItineraryTotals({
      id: 'plan', title: 'plan', destination: { name: 'New York', latitude: 40.7, longitude: -74 }, travelDate: '2026-07-15', startTime: '09:00',
      preferences: { style: 'culture', pace: 'balanced', companion: 'solo' }, partySize: 1,
      spots: [{ spot: { ...spot(10), feeCurrency: 'USD' }, visitOrder: 1 }], routes: [{ durationMinutes: 20, distanceMeters: 1000, cost: 2.5, costCurrency: 'USD' }], status: 'draft',
    });
    expect(result).toMatchObject({ estimatedCost: 12.5, currency: 'USD' });
  });
});
