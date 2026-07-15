import type { TransportMode } from '../../types/travelPlan';

export interface RouteFare { value?: number; currency?: string; text?: string; }
export function estimateRouteCost(mode: TransportMode, _meters: number, fare?: RouteFare): { amount: number | null; currency?: string; note: string } {
  if (mode === 'WALKING') return { amount: 0, note: '' };
  if (mode === 'TRANSIT' && fare?.value !== undefined) return { amount: fare.value, currency: fare.currency, note: 'Google 대중교통 요금' };
  if (mode === 'TRANSIT') return { amount: null, note: 'Google 요금 정보 없음' };
  if (fare?.value !== undefined) return { amount: fare.value, currency: fare.currency, note: 'Google 자동차 통행료' };
  return { amount: 0, note: '' };
}

export function formatRouteCost(amount: number, currency = 'KRW'): string {
  return currency === 'KRW' ? `${amount.toLocaleString('ko-KR')}원` : new Intl.NumberFormat('ko-KR', { style: 'currency', currency }).format(amount);
}
