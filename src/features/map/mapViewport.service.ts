import type { Spot } from '../../types/spot';

const VIEWPORT_PADDING = 48;
const SINGLE_SPOT_ZOOM = 14;

export function fitMapToSpots(map: google.maps.Map, spots: Spot[]): void {
  if (!spots.length) return;

  const bounds = spots.reduce<google.maps.LatLngBoundsLiteral>((current, spot) => ({
    north: Math.max(current.north, spot.latitude),
    south: Math.min(current.south, spot.latitude),
    east: Math.max(current.east, spot.longitude),
    west: Math.min(current.west, spot.longitude),
  }), {
    north: spots[0].latitude,
    south: spots[0].latitude,
    east: spots[0].longitude,
    west: spots[0].longitude,
  });

  if (bounds.north === bounds.south && bounds.east === bounds.west) {
    map.setCenter({ lat: bounds.north, lng: bounds.east });
    map.setZoom(SINGLE_SPOT_ZOOM);
    return;
  }

  map.fitBounds(bounds, VIEWPORT_PADDING);
}
