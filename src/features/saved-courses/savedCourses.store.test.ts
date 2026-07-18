import { describe, expect, it, vi } from 'vitest';
import { planToCourse, updateSavedCourseName } from './savedCourses.store';
import type { TravelPlan } from '../../types/travelPlan';

const plan: TravelPlan = {
  id: 'saved-plan', title: '저장 테스트', destination: { name: '서울', latitude: 37.5, longitude: 127 }, travelDate: '2026-07-15', startTime: '09:00',
  preferences: { style: 'culture', pace: 'balanced', companion: 'solo' }, partySize: 1,
  spots: [{ spot: { id: 'a', name: '장소 A', region: '서울', latitude: 37.5, longitude: 127, category: 'culture', tags: [], description: '', photoUrl: 'https://images.example/a.jpg', feeAmount: 0, feeNote: '', durationMinutes: 90, openingHours: { weekly: {} }, popularity: 1, source: 'places' }, visitOrder: 1 }, { spot: { id: 'b', name: '장소 B', region: '서울', latitude: 37.51, longitude: 127.01, category: 'culture', tags: [], description: '', feeAmount: 0, feeNote: '', durationMinutes: 90, openingHours: { weekly: {} }, popularity: 1, source: 'places' }, visitOrder: 2, transportMode: 'TRANSIT' }],
  routes: [{ durationMinutes: 20, distanceMeters: 2500, cost: 1500, costCurrency: 'KRW', costNote: '대중교통 요금' }], status: 'complete'
};

describe('planToCourse', () => {
  it('저장 코스에 검토용 원본 계획과 이동경로를 보존한다', () => {
    const course = planToCourse(plan);
    expect(course.plan).toEqual(plan);
    expect(course.plan?.routes[0]?.durationMinutes).toBe(20);
    expect(course.plan?.spots[1].transportMode).toBe('TRANSIT');
    expect(course.spots[0].photoUrl).toBe('https://images.example/a.jpg');
  });
});

describe('updateSavedCourseName', () => {
  it('저장 코스와 원본 계획의 이름을 함께 변경한다', () => {
    const course = planToCourse(plan);
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify([course]), setItem: () => undefined, removeItem: () => undefined });
    expect(updateSavedCourseName(plan.id, '새 이름')[0].plan?.title).toBe('새 이름');
    vi.unstubAllGlobals();
  });
});
