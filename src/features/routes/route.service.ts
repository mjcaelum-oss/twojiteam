import type { Spot } from '../../types/spot';
import type { RouteSummary, TransportMode } from '../../types/travelPlan';
import { estimateRouteCost } from './routeCost.utils';

export interface CalculatedRoute { summary: RouteSummary; result?: google.maps.DirectionsResult; }
export const NEARBY_ROUTE_UNAVAILABLE = 'NEARBY_ROUTE_UNAVAILABLE';

const distanceMeters = (origin: Spot, destination: Spot) => {
  const rad = Math.PI / 180;
  const x = (destination.longitude - origin.longitude) * rad * Math.cos(((origin.latitude + destination.latitude) / 2) * rad);
  const y = (destination.latitude - origin.latitude) * rad;
  return Math.sqrt(x * x + y * y) * 6371000;
};
export function isNearbyRouteUnavailable(origin: Spot, destination: Spot, mode: TransportMode): boolean { return mode !== 'WALKING' && distanceMeters(origin, destination) <= 100; }
function transitLabel(step: google.maps.DirectionsStep): string | undefined {
  const details = step.transit ?? step.transit_details;
  if (!details) return undefined;
  const vehicle = details.line?.vehicle?.name;
  const vehicleLabel = vehicle?.toLowerCase() === 'subway' ? '지하철' : vehicle?.toLowerCase() === 'bus' ? '버스' : vehicle;
  const line = details.line?.short_name || details.line?.long_name;
  const headsign = details.headsign ? `${details.headsign}${details.headsign.endsWith('행') ? '' : '행'}` : '';
  return [vehicleLabel, line, headsign].filter(Boolean).join(' ');
}
export function formatTransitDetails(legs: google.maps.DirectionsLeg[]): string | undefined {
  const flatten = (steps: google.maps.DirectionsStep[] = []): google.maps.DirectionsStep[] => steps.flatMap((step) => [step, ...flatten(step.steps)]);
  const labels = legs.flatMap((leg) => flatten(leg.steps).map(transitLabel).filter((label): label is string => Boolean(label)));
  return [...new Set(labels)].join(' → ') || undefined;
}
function fallbackWalkingRoute(origin: Spot, destination: Spot): CalculatedRoute {
  const distance = distanceMeters(origin, destination);
  return { summary: { durationMinutes: Math.max(1, Math.ceil(distance / 83.33)), distanceMeters: Math.round(distance), cost: 0, approximate: true, costNote: '도보 예상 경로' } };
}

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
    if (!route) return mode === 'WALKING' ? fallbackWalkingRoute(origin, destination) : { summary: { durationMinutes: 0, distanceMeters: 0, cost: 0, error: isNearbyRouteUnavailable(origin, destination, mode) ? NEARBY_ROUTE_UNAVAILABLE : 'ZERO_RESULTS' } };
    const distanceMeters = route.legs.reduce((sum, leg) => sum + (leg.distance?.value ?? 0), 0);
    const durationMinutes = Math.ceil(route.legs.reduce((sum, leg) => sum + (leg.duration?.value ?? 0), 0) / 60);
    const cost = estimateRouteCost(mode, distanceMeters, route.fare);
    return { summary: { durationMinutes, distanceMeters, cost: cost.amount, costCurrency: cost.currency, costNote: cost.note, transitDetails: mode === 'TRANSIT' ? formatTransitDetails(route.legs) : undefined }, result };
  } catch (error) {
    return mode === 'WALKING' ? fallbackWalkingRoute(origin, destination) : { summary: { durationMinutes: 0, distanceMeters: 0, cost: 0, error: isNearbyRouteUnavailable(origin, destination, mode) ? NEARBY_ROUTE_UNAVAILABLE : error instanceof Error ? error.message : 'ROUTE_REQUEST_FAILED' } };
  }
}
