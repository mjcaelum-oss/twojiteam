import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { RouteSummary, TravelPlan, TransportMode } from '../../types/travelPlan';
import type { Spot } from '../../types/spot';
import { localPlanRepository } from '../../features/plan-storage/localPlan.repository';
import { supabasePlanRepository } from '../../features/plan-storage/supabasePlan.repository';
import { env } from '../../config/env';
import { readLocal, removeLocal, writeLocal } from '../../services/storage/localStorage.service';

interface TravelPlanContextValue { plan: TravelPlan | null; setPlan: (plan: TravelPlan | null) => void; setDayStartTime: (date: string, time: string) => void; addSpot: (spot: Spot, travelDate?: string, mode?: TransportMode) => void; removeSpot: (id: string) => void; reorderSpot: (id: string, targetIndex: number) => void; setTransport: (index: number, mode: TransportMode) => void; setRoute: (index: number, route: RouteSummary | null) => void; save: (planOverride?: TravelPlan) => Promise<void>; }
const TravelPlanContext = createContext<TravelPlanContextValue | null>(null);
export function TravelPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<TravelPlan | null>(() => readLocal<TravelPlan | null>('active-plan', null));
  const repository = env.dataMode === 'supabase' ? supabasePlanRepository : localPlanRepository;
  const value = useMemo<TravelPlanContextValue>(() => ({
    plan, setPlan,
    setDayStartTime: (date, time) => setPlan((current) => current ? { ...current, dayStartTimes: { ...current.dayStartTimes, [date]: time } } : current),
    addSpot: (spot, travelDate, mode) => setPlan((current) => { if (!current || current.spots.some((item) => item.spot.id === spot.id)) return current; const date = travelDate ?? current.travelDate; const spots = [...current.spots, { spot, travelDate: date, visitOrder: current.spots.length + 1, transportMode: current.spots.some((item) => (item.travelDate ?? current.travelDate) === date) ? (mode ?? 'DRIVING') : undefined }].sort((a, b) => (a.travelDate ?? current.travelDate).localeCompare(b.travelDate ?? current.travelDate)); return { ...current, spots: spots.map((item, index) => ({ ...item, visitOrder: index + 1 })), routes: spots.slice(1).map(() => null) }; }),
    removeSpot: (id) => setPlan((current) => { if (!current) return current; const spots = current.spots.filter((item) => item.spot.id !== id).map((item, index) => ({ ...item, visitOrder: index + 1, ...(index === 0 ? { transportMode: undefined } : {}) })); return { ...current, spots, routes: spots.slice(1).map(() => null) }; }),
    reorderSpot: (id, targetIndex) => setPlan((current) => { if (!current) return current; const sourceIndex = current.spots.findIndex((item) => item.spot.id === id); if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= current.spots.length || sourceIndex === targetIndex) return current; const spots = [...current.spots]; const [moved] = spots.splice(sourceIndex, 1); spots.splice(targetIndex, 0, moved); return { ...current, spots: spots.map((item, index) => ({ ...item, visitOrder: index + 1, transportMode: index ? 'DRIVING' : undefined })), routes: spots.slice(1).map(() => null) }; }),
    setTransport: (index, mode) => setPlan((current) => current ? { ...current, spots: current.spots.map((item, itemIndex) => itemIndex === index + 1 ? { ...item, transportMode: mode } : item), routes: current.routes.map((route, routeIndex) => routeIndex === index ? null : route) } : current),
    setRoute: (index, route) => setPlan((current) => current ? { ...current, routes: current.routes.map((item, itemIndex) => itemIndex === index ? route : item) } : current),
    save: async (planOverride) => { const target = planOverride ?? plan; if (target) await repository.savePlan(target); }
  }), [plan, repository]);
  if (plan) writeLocal('active-plan', plan); else removeLocal('active-plan');
  return <TravelPlanContext.Provider value={value}>{children}</TravelPlanContext.Provider>;
}
export function useTravelPlan() { const value = useContext(TravelPlanContext); if (!value) throw new Error('TravelPlanProvider가 필요합니다.'); return value; }
