import type { TravelPlan } from '../../types/travelPlan';
import type { ItineraryTotals } from './itinerary.types';

export function getItineraryTotals(plan: TravelPlan): ItineraryTotals {
  const currency = [...plan.spots.map((item) => item.spot.feeCurrency), ...plan.routes.map((route) => route?.costCurrency)].find(Boolean) ?? 'KRW';
  return {
    visitMinutes: plan.spots.reduce((sum, item) => sum + item.spot.durationMinutes, 0),
    travelMinutes: plan.routes.reduce((sum, route) => sum + (route?.durationMinutes ?? 0), 0),
    estimatedCost: plan.spots.reduce((sum, item) => sum + ((!item.spot.feeCurrency || item.spot.feeCurrency === currency) ? item.spot.feeAmount * plan.partySize : 0), 0) + plan.routes.reduce((sum, route) => sum + ((!route?.costCurrency || route.costCurrency === currency) ? (route?.cost ?? 0) : 0), 0),
    currency,
  };
}
