import { useEffect, useRef, useState } from 'react';
import type { Spot } from '../../../types/spot';
import { loadGoogleMaps } from '../googleMaps.loader';
import { clearMarkers, createMarkers, type SpotMarker } from '../marker.service';
import { fitMapToSpots } from '../mapViewport.service';
import styles from './TravelMap.module.css';

export function TravelMap({ spots, selected, current, onError }: { spots: Spot[]; selected: Spot[]; current?: Spot; onError?: (message: string) => void }) {
  const element = useRef<HTMLDivElement>(null); const map = useRef<google.maps.Map | null>(null); const markers = useRef<SpotMarker[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { let active = true; loadGoogleMaps().then(() => { if (!active || !element.current) return; map.current = new google.maps.Map(element.current, { center: { lat: 36.35, lng: 127.8 }, zoom: 7 }); setReady(true); }).catch((error) => onError?.(error instanceof Error ? error.message : '지도를 불러오지 못했습니다.')); return () => { active = false; clearMarkers(markers.current); }; }, [onError]);
  useEffect(() => { if (!map.current || !ready) return; clearMarkers(markers.current); markers.current = createMarkers(map.current, spots); fitMapToSpots(map.current, spots); }, [ready, spots]);
  useEffect(() => { if (!map.current || !current) return; map.current.panTo({ lat: current.latitude, lng: current.longitude }); }, [current]);
  return <div className={styles.panel} aria-label="관광지 지도"><div ref={element} className={styles.map} /><div className={styles.status} hidden={ready}>지도를 불러오려면 Google Maps 키가 필요합니다.<br />mock 데이터와 추천 흐름은 지도 없이도 사용할 수 있어요.</div>{selected.length > 0 && <div className={styles.legend}>선택한 장소 {selected.length}곳</div>}</div>;
}
