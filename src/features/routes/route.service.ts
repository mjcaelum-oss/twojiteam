import type { Spot } from '../../types/spot';
import type { RouteSummary, TransportMode } from '../../types/travelPlan';
import { estimateRouteCost } from './routeCost.utils';

export interface CalculatedRoute { summary: RouteSummary; result?: google.maps.DirectionsResult; }

export async function requestRoute(origin: Spot, destination: Spot, mode: TransportMode, departureTime?: Date): Promise<CalculatedRoute> {
  try {
    const service = new google.maps.DirectionsService();
    const result = await service.route({
      origin: origin.address || origin.region || { lat: origin.latitude, lng: origin.longitude },
      destination: destination.address || destination.region || { lat: destination.latitude, lng: destination.longitude },
      travelMode: google.maps.TravelMode[mode],
      ...(mode === 'TRANSIT' ? { transitOptions: { departureTime: departureTime ?? new Date() } } : {})
    });
    const route = result.routes[0];
    if (!route) return { summary: { durationMinutes: 0, distanceMeters: 0, cost: 0, error: 'ZERO_RESULTS' } };
    const distanceMeters = route.legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
    const durationMinutes = Math.ceil(route.legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0) / 60);
    const cost = estimateRouteCost(mode, distanceMeters, route.fare);
    return { summary: { durationMinutes, distanceMeters, cost: cost.amount, costCurrency: cost.currency, costNote: cost.note }, result };
  } catch (error) {
    return { summary: { durationMinutes: 0, distanceMeters: 0, cost: 0, error: error instanceof Error ? error.message : 'ROUTE_REQUEST_FAILED' } };
  }
}
