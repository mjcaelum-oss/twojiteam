import { describe, expect, it } from 'vitest';
import { formatTransitDetails, isNearbyRouteUnavailable } from './route.service';
import type { Spot } from '../../types/spot';

const spot = (latitude: number, longitude: number): Spot => ({ id: `${latitude}:${longitude}`, name: '장소', region: '서울', latitude, longitude, category: 'culture', tags: [], description: '', feeAmount: 0, feeNote: '', durationMinutes: 90, openingHours: { weekly: {} }, popularity: 1, source: 'places' });

describe('nearby route availability', () => {
  it('100m 이내에서는 자동차와 대중교통만 경로 안내 불가 후보로 구분한다', () => {
    const origin = spot(37.5, 127);
    const nearby = spot(37.5004, 127);
    expect(isNearbyRouteUnavailable(origin, nearby, 'WALKING')).toBe(false);
    expect(isNearbyRouteUnavailable(origin, nearby, 'DRIVING')).toBe(true);
    expect(isNearbyRouteUnavailable(origin, nearby, 'TRANSIT')).toBe(true);
  });
  it('Google Maps JavaScript 응답의 대중교통 노선과 행선지를 표시한다', () => {
    expect(formatTransitDetails([{ steps: [{ transit: { line: { short_name: '1호선', vehicle: { name: 'SUBWAY' } }, headsign: '인천' } }] }])).toBe('지하철 1호선 인천행');
  });
});
