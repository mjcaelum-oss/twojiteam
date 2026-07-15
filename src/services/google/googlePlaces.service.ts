import { loadGoogleMaps } from '../../features/map/googleMaps.loader';
import type { Spot } from '../../types/spot';
import type { Destination } from '../../types/travelPlan';

const types = ['tourist_attraction', 'museum', 'park', 'art_gallery', 'historical_landmark', 'restaurant', 'cafe', 'bakery', 'amusement_park', 'zoo', 'aquarium'];
const stayMinutesByType: Record<string, number> = { museum: 120, historical_landmark: 120, art_gallery: 90, tourist_attraction: 90, park: 60 };
function durationMinutesFor(placeTypes: string[] = []): number { const type = placeTypes.find((candidate) => stayMinutesByType[candidate]); return type ? stayMinutesByType[type] : 90; }
function categoryFor(placeTypes: string[] = []): Spot['category'] {
  if (placeTypes.some((type) => ['museum', 'art_gallery', 'historical_landmark'].includes(type))) return 'culture';
  if (placeTypes.some((type) => ['restaurant', 'cafe', 'bakery'].includes(type))) return 'food';
  if (placeTypes.some((type) => ['amusement_park', 'zoo', 'aquarium'].includes(type))) return 'activity';
  return 'nature';
}
function venueTypeFor(placeTypes: string[] = []): Spot['venueType'] {
  if (placeTypes.includes('restaurant')) return 'restaurant';
  if (placeTypes.includes('cafe')) return 'cafe';
  if (placeTypes.includes('bakery')) return 'bakery';
  return undefined;
}
function openingHoursFor(place: google.maps.places.PlaceData): Spot['openingHours'] {
  const source = place.currentOpeningHours ?? place.regularOpeningHours;
  const weekly: Spot['openingHours']['weekly'] = {};
  for (const period of source?.periods ?? []) {
    const day = period.open.day as 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
    if (day === undefined || !period.close || period.open.hour === undefined || period.open.minute === undefined || period.close.hour === undefined || period.close.minute === undefined) continue;
    const next = { open: `${String(period.open.hour).padStart(2, '0')}:${String(period.open.minute).padStart(2, '0')}`, close: `${String(period.close.hour).padStart(2, '0')}:${String(period.close.minute).padStart(2, '0')}` };
    const current = weekly[day];
    weekly[day] = current ? { open: current.open < next.open ? current.open : next.open, close: current.close > next.close ? current.close : next.close } : next;
  }
  const status = place.businessStatus ?? 'UNKNOWN';
  const note = source ? undefined : 'Google Places 운영시간 정보 없음 · 방문 전 확인 필요';
  return { weekly, note, status };
}
function priceFor(place: google.maps.places.PlaceData): { amount: number; currency?: string; note: string } {
  const start = place.priceRange?.startPrice;
  if (!start?.currencyCode || start.units === undefined) return { amount: 0, note: '가격 정보 없음 · 현장 확인 필요' };
  const amount = Number(start.units) + (start.nanos ?? 0) / 1e9;
  return { amount, currency: start.currencyCode, note: `Google 가격 정보: ${amount} ${start.currencyCode}` };
}
export async function searchTouristSpots(destination: Destination, radius = 10000): Promise<Spot[]> {
  await loadGoogleMaps();
  const library = await google.maps.importLibrary('places') as { Place: typeof google.maps.places.Place };
  const { places = [] } = await library.Place.searchNearby({ fields: ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsURI', 'types', 'photos', 'rating', 'userRatingCount', 'priceRange', 'regularOpeningHours', 'currentOpeningHours', 'businessStatus'], locationRestriction: { center: { lat: destination.latitude, lng: destination.longitude }, radius }, includedPrimaryTypes: types, maxResultCount: 20, rankPreference: 'POPULARITY' });
  const durationById = new Map<string, number>(places.flatMap((place) => place.id ? [[`place:${place.id}`, durationMinutesFor(place.types)] as const] : []));
  return places.flatMap((place): Spot[] => {
    if (!place.id || !place.displayName || !place.location) return [];
    const category = categoryFor(place.types); const fee = priceFor(place);
    return [{ id: `place:${place.id}`, name: place.displayName, address: place.formattedAddress ?? destination.name, region: place.formattedAddress ?? destination.name, latitude: place.location.lat(), longitude: place.location.lng(), category, venueType: venueTypeFor(place.types), tags: [...new Set([category, 'balanced', ...(place.types ?? [])])], description: `${destination.name}에서 찾은 Google Places 관광지`, photoUrl: place.photos?.[0]?.getURI({ maxWidth: 800, maxHeight: 500 }), feeAmount: fee.amount, feeCurrency: fee.currency, feeNote: fee.note, durationMinutes: 90, openingHours: openingHoursFor(place), popularity: Math.min(1, (place.rating ?? 0) / 5), source: 'places', sourceUrl: place.googleMapsURI, lastVerifiedAt: new Date().toISOString() }];
  }).map((spot) => ({ ...spot, durationMinutes: durationById.get(spot.id) ?? 90 }));
}
