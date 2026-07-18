import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TravelPlan } from '../../types/travelPlan';
import initialTravelPlanMigration from '../../../supabase/migrations/20260715020000_mvp_travel_plans.sql?raw';
import upsertFixMigration from '../../../supabase/migrations/20260715030000_fix_mvp_travel_plan_upsert.sql?raw';

const user = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  email: 'traveler@example.com',
  displayName: '여행자',
  phone: null,
  createdAt: '2026-07-15T00:00:00.000Z',
};

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  sessionUser: null as typeof user | null,
}));

vi.mock('../../services/supabase/supabase.client', () => ({
  supabase: { rpc: mocks.rpc },
}));

vi.mock('../../services/supabase/auth.service', () => ({
  getSession: () => ({ user: mocks.sessionUser }),
}));

import { supabasePlanRepository } from './supabasePlan.repository';

const plan: TravelPlan = {
  id: '11111111-1111-4111-8111-111111111111',
  title: '서울 여행 계획',
  destination: { name: '서울', latitude: 37.5, longitude: 127 },
  travelDate: '2026-07-15',
  returnDate: '2026-07-16',
  startTime: '09:00',
  dayStartTimes: { '2026-07-15': '09:00' },
  preferences: { style: 'culture', pace: 'balanced', companion: 'friends' },
  partySize: 2,
  spots: [],
  routes: [],
  status: 'draft',
};

describe('Supabase MVP travel-plan repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionUser = user;
  });

  it('현재 MVP 사용자 ID와 전체 계획 JSON을 저장 RPC에 전달한다', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ plan_data: plan }], error: null });

    await expect(supabasePlanRepository.savePlan(plan)).resolves.toEqual(plan);

    expect(mocks.rpc).toHaveBeenCalledWith('save_mvp_travel_plan', {
      p_owner_id: user.id,
      p_plan: plan,
    });
  });

  it('계획 수정도 같은 upsert RPC를 사용한다', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ plan_data: plan }], error: null });

    await supabasePlanRepository.updatePlan({ ...plan, title: '수정된 계획' });

    expect(mocks.rpc).toHaveBeenCalledWith('save_mvp_travel_plan', {
      p_owner_id: user.id,
      p_plan: { ...plan, title: '수정된 계획' },
    });
  });

  it('본인 소유 계획의 JSON을 조회해 TravelPlan으로 복원한다', async () => {
    mocks.rpc.mockResolvedValue({ data: [{ plan_data: plan }], error: null });

    await expect(supabasePlanRepository.getPlan(plan.id)).resolves.toEqual(plan);
    expect(mocks.rpc).toHaveBeenCalledWith('get_mvp_travel_plan', {
      p_owner_id: user.id,
      p_plan_id: plan.id,
    });
  });

  it('로그인 세션이 없으면 Supabase 요청 전에 저장을 중단한다', async () => {
    mocks.sessionUser = null;

    await expect(supabasePlanRepository.savePlan(plan)).rejects.toThrow('다시 로그인');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('마이그레이션이 없으면 적용 방법을 알 수 있는 오류를 반환한다', async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.save_mvp_travel_plan' },
    });

    await expect(supabasePlanRepository.savePlan(plan)).rejects.toThrow('최신 SQL 마이그레이션');
  });

  it('삭제할 때도 사용자 ID와 계획 ID를 함께 전달한다', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    await supabasePlanRepository.deletePlan(plan.id);

    expect(mocks.rpc).toHaveBeenCalledWith('delete_mvp_travel_plan', {
      p_owner_id: user.id,
      p_plan_id: plan.id,
    });
  });
});

describe('Supabase MVP travel-plan migrations', () => {
  it.each([
    ['initial migration', initialTravelPlanMigration],
    ['already-installed database fix', upsertFixMigration],
  ])('%s targets the primary-key constraint without an ambiguous id reference', (_, migrationSql) => {
    const executableSql = migrationSql.replace(/--.*$/gm, '');
    expect(executableSql).toContain('on conflict on constraint mvp_travel_plans_pkey');
    expect(executableSql).not.toMatch(/on conflict\s*\(\s*id\s*\)/i);
  });
});
