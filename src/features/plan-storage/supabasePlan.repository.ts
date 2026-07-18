import type { TravelPlan } from '../../types/travelPlan';
import { getSession } from '../../services/supabase/auth.service';
import { supabase } from '../../services/supabase/supabase.client';
import type { PlanRepository } from './plan.repository';

interface RpcError {
  code?: string;
  message: string;
}

interface StoredPlanRow {
  plan_data?: unknown;
}

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인하세요.');
  }
  return supabase;
}

function requireOwnerId(): string {
  const user = getSession().user;
  if (!user) throw new Error('여행 계획을 저장하려면 다시 로그인해 주세요.');
  return user.id;
}

function repositoryError(operation: string, error: RpcError): Error {
  if (error.code === 'PGRST202' || error.message.includes('mvp_travel_plan')) {
    return new Error('Supabase 여행 계획 저장 기능이 아직 설치되지 않았습니다. 최신 SQL 마이그레이션을 적용해 주세요.');
  }
  return new Error(`${operation}에 실패했습니다: ${error.message}`);
}

function toTravelPlan(value: unknown): TravelPlan {
  if (!value || typeof value !== 'object') throw new Error('저장된 여행 계획 형식이 올바르지 않습니다.');
  const plan = value as Partial<TravelPlan>;
  if (!plan.id || !plan.title || !plan.destination || !Array.isArray(plan.spots) || !Array.isArray(plan.routes)) {
    throw new Error('저장된 여행 계획의 필수 정보가 누락되었습니다.');
  }
  return plan as TravelPlan;
}

async function save(plan: TravelPlan): Promise<TravelPlan> {
  const client = requireClient();
  const ownerId = requireOwnerId();
  const { error } = await client.rpc('save_mvp_travel_plan', {
    p_owner_id: ownerId,
    p_plan: plan,
  });
  if (error) throw repositoryError('여행 계획 저장', error);
  return plan;
}

export const supabasePlanRepository: PlanRepository = {
  async getPlan(id) {
    const client = requireClient();
    const ownerId = requireOwnerId();
    const { data, error } = await client.rpc('get_mvp_travel_plan', {
      p_owner_id: ownerId,
      p_plan_id: id,
    });
    if (error) throw repositoryError('여행 계획 조회', error);

    const row = (Array.isArray(data) ? data[0] : data) as StoredPlanRow | null | undefined;
    return row?.plan_data === undefined ? null : toTravelPlan(row.plan_data);
  },

  savePlan: save,
  updatePlan: save,

  async deletePlan(id) {
    const client = requireClient();
    const ownerId = requireOwnerId();
    const { error } = await client.rpc('delete_mvp_travel_plan', {
      p_owner_id: ownerId,
      p_plan_id: id,
    });
    if (error) throw repositoryError('여행 계획 삭제', error);
  },
};
