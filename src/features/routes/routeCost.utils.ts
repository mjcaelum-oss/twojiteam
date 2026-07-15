import type { TransportMode } from '../../types/travelPlan';

export function estimateRouteCost(mode: TransportMode, _meters: number, fare?: number): { amount: number; note: string } {
  if (mode === 'WALKING') return { amount: 0, note: '' };
  if (mode === 'TRANSIT' && fare !== undefined) return { amount: fare, note: '대중교통 예상 요금' };
  if (mode === 'TRANSIT') return { amount: 0, note: '대중교통 요금 확인 필요' };
  if (fare !== undefined) return { amount: fare, note: '자동차 통행료 예상' };
  return { amount: 0, note: '' };
}
