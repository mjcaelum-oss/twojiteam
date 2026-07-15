import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { RouteSummary, TravelPlan, TransportMode } from '../../types/travelPlan';
import type { Spot } from '../../types/spot';
import { localPlanRepository } from '../../features/plan-storage/localPlan.repository';
import { supabasePlanRepository } from '../../features/plan-storage/supabasePlan.repository';
import { env } from '../../config/env';
import { readLocal, removeLocal, writeLocal } from '../../services/storage/localStorage.service';

interface TravelPlanContextValue { plan: TravelPlan | null; setPlan: (plan: TravelPlan | null) => void; addSpot: (spot: Spot, mode?: TransportMode) => void; removeSpot: (id: string) => void; moveSpot: (id: string, direction: -1 | 1) => void; setTransport: (index: number, mode: TransportMode) => void; setRoute: (index: number, route: RouteSummary | null) => void; save: () => Promise<void>; }
const TravelPlanContext = createContext<TravelPlanContextValue | null>(null);
export function TravelPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<TravelPlan | null>(() => readLocal<TravelPlan | null>('active-plan', null));
  const repository = env.dataMode === 'supabase' ? supabasePlanRepository : localPlanRepository;
  const value = useMemo<TravelPlanContextValue>(() => ({
    plan, setPlan,
    addSpot: (spot, mode) => setPlan((current) => current ? { ...current, spots: [...current.spots, { spot, visitOrder: current.spots.length + 1, transportMode: current.spots.length ? (mode ?? 'DRIVING') : undefined }], routes: current.spots.length ? [...current.routes, null] : current.routes } : current),
    removeSpot: (id) => setPlan((current) => current ? { ...current, spots: current.spots.filter((item) => item.spot.id !== id).map((item, index) => ({ ...item, visitOrder: index + 1 })), routes: current.routes.slice(0, Math.max(0, current.spots.length - 2)) } : current),
    moveSpot: (id, direction) => setPlan((current) => { if (!current) return current; const index = current.spots.findIndex((item) => item.spot.id === id); const target = index + direction; if (index < 0 || target < 0 || target >= current.spots.length) return current; const spots = [...current.spots]; [spots[index], spots[target]] = [spots[target], spots[index]]; return { ...current, spots: spots.map((item, order) => ({ ...item, visitOrder: order + 1 })) }; }),
    setTransport: (index, mode) => setPlan((current) => current ? { ...current, spots: current.spots.map((item, itemIndex) => itemIndex === index ? { ...item, transportMode: mode } : item) } : current),
    setRoute: (index, route) => setPlan((current) => current ? { ...current, routes: current.routes.map((item, itemIndex) => itemIndex === index ? route : item) } : current),
    save: async () => { if (plan) await repository.savePlan(plan); }
  }), [plan, repository]);
  if (plan) writeLocal('active-plan', plan); else removeLocal('active-plan');
  return <TravelPlanContext.Provider value={value}>{children}</TravelPlanContext.Provider>;
}
export function useTravelPlan() { const value = useContext(TravelPlanContext); if (!value) throw new Error('TravelPlanProvider가 필요합니다.'); return value; }
