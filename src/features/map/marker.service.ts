import type { Spot } from '../../types/spot';
import { getSpotColor } from './spotColors';
export interface SpotMarker { marker: google.maps.Marker; spot: Spot; }
export function createMarkers(map: google.maps.Map, spots: Spot[], highlightedId?: string): SpotMarker[] { return spots.map((spot, index) => { const highlighted = spot.id === highlightedId; const color = getSpotColor(index).value; return { spot, marker: new google.maps.Marker({ map, position: { lat: spot.latitude, lng: spot.longitude }, title: spot.name, label: { text: String(index + 1), color: '#fff', fontWeight: '700' }, icon: { path: 'M 0,-8 A 8,8 0 1,0 0,8 A 8,8 0 1,0 0,-8', fillColor: color, fillOpacity: 1, strokeColor: highlighted ? '#111827' : '#fff', strokeWeight: highlighted ? 4 : 2, scale: highlighted ? 1.7 : 1.2 } }) }; }); }
export function clearMarkers(markers: SpotMarker[]): void { markers.forEach(({ marker }) => marker.setMap(null)); }
