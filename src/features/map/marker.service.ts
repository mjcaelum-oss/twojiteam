import type { Spot } from '../../types/spot';
import { getSpotColor } from './spotColors';
export interface SpotMarker { marker: google.maps.Marker; spot: Spot; }
const categoryIcons: Record<Spot['category'], string> = { culture: '🏛', nature: '🌿', food: '🍴', activity: '★' };
const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
const candidateIcon = (spot: Spot, color: string, highlighted: boolean) => {
  const name = escapeXml(spot.name);
  const icon = escapeXml(categoryIcons[spot.category]);
  const width = Math.min(240, Math.max(104, 48 + spot.name.length * 14));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="36" viewBox="0 0 ${width} 36"><rect x="1" y="1" width="${width - 2}" height="34" rx="17" fill="${color}" stroke="${highlighted ? '#111827' : '#fff'}" stroke-width="${highlighted ? 3 : 2}"/><circle cx="19" cy="18" r="11" fill="#fff" fill-opacity=".95"/><text x="19" y="23" text-anchor="middle" font-size="14">${icon}</text><text x="36" y="23" fill="#fff" font-family="Arial,sans-serif" font-size="13" font-weight="700">${name}</text></svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, anchor: new google.maps.Point(width / 2, 18) };
};
export function createMarkers(map: google.maps.Map, spots: Spot[], highlightedId?: string, selectedIds = new Set<string>()): SpotMarker[] {
  let selectedNumber = 0;
  return spots.map((spot, index) => {
    const selected = selectedIds.has(spot.id);
    const highlighted = spot.id === highlightedId;
    const color = getSpotColor(index).value;
    const markerIcon = selected ? { path: 'M 0,-8 A 8,8 0 1,0 0,8 A 8,8 0 1,0 0,-8', fillColor: color, fillOpacity: 1, strokeColor: highlighted ? '#111827' : '#fff', strokeWeight: highlighted ? 4 : 2, scale: highlighted ? 1.7 : 1.2 } : candidateIcon(spot, color, highlighted);
    return { spot, marker: new google.maps.Marker({ map, position: { lat: spot.latitude, lng: spot.longitude }, title: spot.name, label: selected ? { text: String(++selectedNumber), color: '#fff', fontWeight: '700' } : undefined, icon: markerIcon }) };
  });
}
export function clearMarkers(markers: SpotMarker[]): void { markers.forEach(({ marker }) => marker.setMap(null)); }
