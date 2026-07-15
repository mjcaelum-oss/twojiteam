import { useEffect, useMemo, useRef, useState } from 'react';
import type { Spot } from '../../../types/spot';
import type { TransportMode } from '../../../types/travelPlan';
import { loadGoogleMaps } from '../googleMaps.loader';
import { clearMarkers, createMarkers, type SpotMarker } from '../marker.service';
import { fitMapToSpots } from '../mapViewport.service';
import styles from './TravelMap.module.css';

interface MapRoute { origin: Spot; destination: Spot; mode: TransportMode; departureTime?: Date; result?: google.maps.DirectionsResult; }
const routeColors = ['#2563eb', '#dc2626', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#db2777', '#92400e'];

export function TravelMap({ spots, selected, current, routes = [], onError }: { spots: Spot[]; selected: Spot[]; current?: Spot; routes?: MapRoute[]; onError?: (message: string) => void }) {
  const element = useRef<HTMLDivElement>(null); const map = useRef<google.maps.Map | null>(null); const directions = useRef<google.maps.DirectionsRenderer[]>([]); const markers = useRef<SpotMarker[]>([]); const [ready, setReady] = useState(false);
  const mapSpots = useMemo(() => [...selected, ...spots.filter((spot) => !selected.some((item) => item.id === spot.id))], [selected, spots]);
  const routeKey = routes.map(({ origin, destination, mode, result }) => `${origin.id}:${destination.id}:${mode}:${Boolean(result)}`).join('|');
  useEffect(() => { let active = true; void loadGoogleMaps().then(() => { if (!active || !element.current) return; map.current = new google.maps.Map(element.current, { center: { lat: 36.35, lng: 127.8 }, zoom: 7 }); setReady(true); }).catch((error) => onError?.(error instanceof Error ? error.message : '지도를 불러오지 못했습니다.')); return () => { active = false; directions.current.forEach((renderer) => renderer.setMap(null)); clearMarkers(markers.current); }; }, [onError]);
  useEffect(() => { if (!map.current || !ready) return; clearMarkers(markers.current); markers.current = createMarkers(map.current, mapSpots); fitMapToSpots(map.current, mapSpots); }, [ready, mapSpots]);
  useEffect(() => {
    if (!map.current || !ready) return;
    let active = true;
    void google.maps.importLibrary('routes').then(async (library) => {
      if (!active || !map.current) return;
      directions.current.forEach((renderer) => renderer.setMap(null));
      directions.current = [];
      const { DirectionsRenderer, DirectionsService } = library as { DirectionsRenderer: typeof google.maps.DirectionsRenderer; DirectionsService: typeof google.maps.DirectionsService };
      const service = new DirectionsService();
      for (const [index, segment] of routes.entries()) {
        try {
          const result = segment.result ?? await service.route({ origin: segment.origin.address || segment.origin.region || { lat: segment.origin.latitude, lng: segment.origin.longitude }, destination: segment.destination.address || segment.destination.region || { lat: segment.destination.latitude, lng: segment.destination.longitude }, travelMode: google.maps.TravelMode[segment.mode], ...(segment.mode === 'TRANSIT' ? { transitOptions: { departureTime: segment.departureTime ?? new Date() } } : {}) });
          if (!active || !map.current) return;
          const renderer = new DirectionsRenderer({ map: map.current, suppressMarkers: true, preserveViewport: true, polylineOptions: { strokeColor: routeColors[index % routeColors.length], strokeOpacity: .85, strokeWeight: 5 } });
          renderer.setDirections(result); directions.current.push(renderer);
        } catch (error) { onError?.(error instanceof Error ? error.message : '경로를 지도에 표시하지 못했습니다.'); }
      }
    });
    return () => { active = false; };
  // Route requests are keyed by stable spot ids and mode; avoid refetching on plan object updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeKey]);
  useEffect(() => { if (!map.current || !current) return; map.current.panTo({ lat: current.latitude, lng: current.longitude }); }, [current]);
  return <div className={styles.panel} aria-label="관광지 지도"><div ref={element} className={styles.map} /><div className={styles.status} hidden={ready}>지도를 불러오려면 Google Maps 키가 필요합니다.<br />mock 데이터와 추천 흐름은 지도 없이도 사용할 수 있어요.</div>{selected.length > 0 && <div className={styles.legend}>선택한 장소 {selected.length}곳</div>}{routes.length > 0 && <div className={styles.routeLegend}>{routes.map((segment, index) => <span key={`${segment.origin.id}-${segment.destination.id}`}><i style={{ backgroundColor: routeColors[index % routeColors.length] }} />{index + 1}. {segment.origin.name} → {segment.destination.name}</span>)}</div>}</div>;
}
