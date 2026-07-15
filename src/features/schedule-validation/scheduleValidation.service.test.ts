import { describe, expect, it } from 'vitest';
import type { Spot } from '../../types/spot';
import type { TravelPlan } from '../../types/travelPlan';
import { buildSchedule, validateSchedule } from './scheduleValidation.service';

const spot: Spot = { id: 'spot', name: '테스트 장소', region: '서울', latitude: 37.5, longitude: 127, category: 'culture', tags: ['culture'], description: '', feeAmount: 0, feeNote: '', durationMinutes: 90, openingHours: { weekly: { 2: { open: '09:00', close: '18:00' } } }, popularity: .8, source: 'places' };
const plan: TravelPlan = { id: 'test', title: 'test', destination: { name: '서울', latitude: 37.5, longitude: 127 }, travelDate: '2026-07-14', startTime: '17:30', preferences: { style: 'culture', pace: 'slow', companion: 'solo' }, partySize: 1, spots: [{ spot, visitOrder: 1 }, { spot: { ...spot, id: 'spot-2', name: '테스트 장소 2' }, visitOrder: 2 }], routes: [{ durationMinutes: 20, distanceMeters: 5000, cost: 0 }], status: 'draft' };

describe('schedule validation', () => {
  it('calculates arrival and departure in order', () => { const result = buildSchedule(plan); expect(result).toHaveLength(2); expect(result[1].arrival.getTime()).toBeGreaterThan(result[0].departure.getTime()); });
  it('warns when a place is near closing time', () => { expect(validateSchedule(plan).length).toBeGreaterThan(0); });
  it('does not treat missing opening hours as a closed place', () => {
    const unknownHoursPlan = { ...plan, spots: [{ ...plan.spots[0], spot: { ...spot, openingHours: { weekly: {} } } }], routes: [] };
    expect(validateSchedule(unknownHoursPlan)).toEqual([]);
  });
  it('warns for an explicitly closed date', () => {
    const closedDatePlan = { ...plan, spots: [{ ...plan.spots[0], spot: { ...spot, openingHours: { weekly: {}, closedDates: ['2026-07-14'] } } }], routes: [] };
    expect(validateSchedule(closedDatePlan)).toHaveLength(1);
  });
  it('starts each new travel day at 09:00', () => {
    const multiDayPlan = { ...plan, spots: [{ ...plan.spots[0], travelDate: '2026-07-14' }, { ...plan.spots[1], travelDate: '2026-07-15' }], routes: [null] };
    expect(buildSchedule(multiDayPlan)[1].arrival.toTimeString()).toContain('09:00');
  });
});
