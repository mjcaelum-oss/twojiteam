import { loadGoogleMaps } from '../../features/map/googleMaps.loader';
import type { Spot } from '../../types/spot';
import type { Destination } from '../../types/travelPlan';

const types = ['tourist_attraction', 'museum', 'park', 'art_gallery', 'historical_landmark', 'restaurant', 'cafe', 'bakery', 'amusement_park', 'zoo', 'aquarium'];
const stayMinutesByType: Record<string, number> = { museum: 120, historical_landmark: 120, art_gallery: 90, tourist_attraction: 90, park: 60 };
function durationMinutesFor(placeTypes: string[] = []): number {
  const type = placeTypes.find((candidate) => stayMinutesByType[candidate]);
  return type ? stayMinutesByType[type] : 90;
}

function categoryFor(placeTypes: string[] = []): Spot['category'] {
  if (placeTypes.some((type) => ['museum', 'art_gallery', 'historical_landmark'].includes(type))) return 'culture';
  if (placeTypes.some((type) => ['restaurant', 'cafe', 'bakery'].includes(type))) return 'food';
  if (placeTypes.some((type) => ['amusement_park', 'zoo', 'aquarium'].includes(type))) return 'activity';
  return 'nature';
}

export async function searchTouristSpots(destination: Destination, radius = 10000): Promise<Spot[]> {
  await loadGoogleMaps();
  const library = await google.maps.importLibrary('places') as { Place: typeof google.maps.places.Place };
  const { places = [] } = await library.Place.searchNearby({ fields: ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsURI', 'types', 'photos', 'rating', 'userRatingCount'], locationRestriction: { center: { lat: destination.latitude, lng: destination.longitude }, radius }, includedPrimaryTypes: types, maxResultCount: 10, rankPreference: 'POPULARITY' });
  const durationById = new Map<string, number>(places.flatMap((place) => place.id ? [[`place:${place.id}`, durationMinutesFor(place.types)] as const] : []));
  return places.flatMap((place): Spot[] => {
    if (!place.id || !place.displayName || !place.location) return [];

    const category = categoryFor(place.types);
    return [{ id: `place:${place.id}`, name: place.displayName, address: place.formattedAddress ?? destination.name, region: place.formattedAddress ?? destination.name, latitude: place.location.lat(), longitude: place.location.lng(), category, tags: [category, 'balanced'], description: `${destination.name}에서 찾은 Google Places 관광지`, photoUrl: place.photos?.[0]?.getURI({ maxWidth: 800, maxHeight: 500 }), feeAmount: 0, feeNote: '현장 확인 필요', durationMinutes: 90, openingHours: { weekly: {} }, popularity: Math.min(1, (place.rating ?? 0) / 5), source: 'places', sourceUrl: place.googleMapsURI, lastVerifiedAt: new Date().toISOString() }];
  }).map((spot) => ({ ...spot, durationMinutes: durationById.get(spot.id) ?? 90 }));
}
