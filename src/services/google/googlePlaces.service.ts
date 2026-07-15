import { loadGoogleMaps } from '../../features/map/googleMaps.loader';
import type { Spot } from '../../types/spot';
import type { Destination } from '../../types/travelPlan';

const types = ['tourist_attraction', 'museum', 'park', 'art_gallery', 'historical_landmark'];
function categoryFor(placeTypes: string[] = []): Spot['category'] {
  if (placeTypes.some((type) => ['museum', 'art_gallery', 'historical_landmark'].includes(type))) return 'culture';
  if (placeTypes.some((type) => ['restaurant', 'cafe', 'bakery'].includes(type))) return 'food';
  return 'nature';
}

export async function searchTouristSpots(destination: Destination, radius = 10000): Promise<Spot[]> {
  await loadGoogleMaps();
  const library = await google.maps.importLibrary('places') as { Place: typeof google.maps.places.Place };
  const { places = [] } = await library.Place.searchNearby({ fields: ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsURI', 'types', 'rating', 'userRatingCount'], locationRestriction: { center: { lat: destination.latitude, lng: destination.longitude }, radius }, includedPrimaryTypes: types, maxResultCount: 10, rankPreference: 'POPULARITY' });
  return places.flatMap((place): Spot[] => {
    if (!place.id || !place.displayName || !place.location) return [];

    const category = categoryFor(place.types);
    return [{ id: `place:${place.id}`, name: place.displayName, region: place.formattedAddress ?? destination.name, latitude: place.location.lat(), longitude: place.location.lng(), category, tags: [category, 'balanced'], description: `${destination.name}에서 찾은 Google Places 관광지`, feeAmount: 0, feeNote: '현장 확인 필요', durationMinutes: 90, openingHours: { weekly: {} }, popularity: Math.min(1, (place.rating ?? 0) / 5), source: 'places', sourceUrl: place.googleMapsURI, lastVerifiedAt: new Date().toISOString() }];
  });
}
