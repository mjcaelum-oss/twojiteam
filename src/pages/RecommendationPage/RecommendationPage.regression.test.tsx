import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScoredSpot } from '../../features/recommendations/recommendation.types';
import type { TravelPlan } from '../../types/travelPlan';
import { RecommendationCard } from '../../features/recommendations/components/RecommendationCard';
import { RecommendationPage } from './RecommendationPage';

const mocks = vi.hoisted(() => ({
  plan: null as TravelPlan | null,
  addSpot: vi.fn(),
  setTransport: vi.fn(),
  setRoute: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../app/providers/TravelPlanProvider', () => ({
  useTravelPlan: () => ({
    plan: mocks.plan,
    addSpot: mocks.addSpot,
    setTransport: mocks.setTransport,
    setRoute: mocks.setRoute,
  }),
}));
vi.mock('../../hooks/useLocalStorage', () => ({ useLocalStorage: () => [[], vi.fn()] }));
vi.mock('../../components/layout/Header/Header', () => ({ Header: () => null }));
vi.mock('../../features/map/components/TravelMap', () => ({ TravelMap: () => null }));

function spot(id: string, name: string): ScoredSpot {
  return {
    id,
    name,
    region: '서울',
    latitude: 37.5,
    longitude: 127,
    category: 'culture',
    tags: ['문화'],
    description: `${name} 설명`,
    feeAmount: 0,
    feeNote: '',
    durationMinutes: 90,
    openingHours: { weekly: {} },
    popularity: 0.8,
    source: 'places',
    score: 1,
    reason: `${name} 추천 이유`,
  };
}

describe('recommendation merge regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('추천 카드에는 개별 후보 제외 버튼이 없다', () => {
    const html = renderToStaticMarkup(
      <RecommendationCard
        spot={spot('first', '첫 번째')}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(html).not.toContain('다음 후보로');
  });

  it('선택한 두 장소 사이의 이동수단 선택 단계를 렌더링한다', () => {
    const first = spot('first', '첫 번째');
    const second = spot('second', '두 번째');
    mocks.plan = {
      id: 'plan',
      title: '서울 여행',
      destination: { name: '서울', latitude: 37.5, longitude: 127 },
      travelDate: '2026-07-15',
      startTime: '09:00',
      preferences: { style: 'culture', pace: 'balanced', companion: 'friends' },
      partySize: 2,
      spots: [
        { spot: first, visitOrder: 1 },
        { spot: second, visitOrder: 2, transportMode: 'DRIVING' },
      ],
      routes: [null],
      status: 'draft',
    };

    const html = renderToStaticMarkup(<RecommendationPage />);

    expect(html).toContain('첫 번째에서 두 번째까지 이동');
    expect(html).toContain('자동차');
    expect(html).toContain('대중교통');
    expect(html).toContain('도보');
  });
});
