import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Spot } from '../../types/spot';
import type { TravelPlan } from '../../types/travelPlan';
import { ReviewPage } from './ReviewPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setPlan: vi.fn(),
  removeSpot: vi.fn(),
  reorderSpot: vi.fn(),
  setTransport: vi.fn(),
  setRoute: vi.fn(),
  save: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => mocks.navigate,
}));
vi.mock('../../components/layout/Header/Header', () => ({ Header: () => null }));
vi.mock('../../features/map/components/TravelMap', () => ({ TravelMap: () => null }));

function spot(id: string, name: string, feeAmount: number, feeCurrency: string): Spot {
  return {
    id,
    name,
    region: 'Test region',
    latitude: 37.5,
    longitude: 127,
    category: 'culture',
    tags: ['test'],
    description: `${name} description`,
    feeAmount,
    feeCurrency,
    feeNote: '',
    durationMinutes: 60,
    openingHours: { weekly: {} },
    popularity: 0.8,
    source: 'mock',
  };
}

const plan: TravelPlan = {
  id: 'merge-regression-plan',
  title: 'Two day trip',
  destination: { name: 'Test city', latitude: 37.5, longitude: 127 },
  travelDate: '2026-07-15',
  returnDate: '2026-07-16',
  startTime: '09:00',
  preferences: { style: 'culture', pace: 'balanced', companion: 'friends' },
  partySize: 1,
  spots: [
    { spot: spot('day-one', 'First day spot', 12.5, 'USD'), visitOrder: 1, travelDate: '2026-07-15' },
    { spot: spot('day-two', 'Second day spot', 10000, 'KRW'), visitOrder: 2, travelDate: '2026-07-16' },
  ],
  routes: [null],
  status: 'draft',
};

vi.mock('../../app/providers/TravelPlanProvider', () => ({
  useTravelPlan: () => ({ plan, ...mocks }),
}));

describe('ReviewPage merge regression', () => {
  it('renders the selected day and its currency-aware totals', () => {
    const html = renderToStaticMarkup(<ReviewPage />);

    expect(html).toContain('First day spot');
    expect(html).not.toContain('Second day spot');
    expect(html).toContain('US$12.50');
  });
});
