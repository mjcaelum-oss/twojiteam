import { env } from '../../config/env';

let loading: Promise<void> | null = null;
export function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (!env.googleMapsApiKey) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY가 없어 지도를 사용할 수 없습니다.'));
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(env.googleMapsApiKey)}&libraries=places&loading=async&callback=initTravelPickMap&language=ko`;
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps JavaScript API를 불러오지 못했습니다.'));
    window.initTravelPickMap = resolve;
    window.gm_authFailure = () => reject(new Error('Google Maps API 키 인증에 실패했습니다.'));
    document.head.appendChild(script);
  });
  return loading;
}
