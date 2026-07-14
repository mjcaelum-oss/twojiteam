declare namespace google.maps {
  interface LatLngLiteral { lat: number; lng: number }
  class Map { constructor(element: HTMLElement, options?: { center?: LatLngLiteral; zoom?: number }); setCenter(center: LatLngLiteral): void; panTo(center: LatLngLiteral): void; }
  class Marker { constructor(options: { map: Map; position: LatLngLiteral; title?: string }); setMap(map: Map | null): void; setZIndex(index: number): void; }
  class InfoWindow { constructor(); setContent(content: string): void; open(map: Map, marker: Marker): void; }
  class DirectionsService { route(request: Record<string, unknown>, callback: (result: DirectionsResult | null, status: string) => void): void; }
  class DirectionsRenderer { constructor(options?: { map?: Map; suppressMarkers?: boolean; preserveViewport?: boolean }); setDirections(result: DirectionsResult): void; setMap(map: Map | null): void; }
  interface DirectionsResult { routes: Array<{ legs: Array<{ distance?: { value?: number }; duration?: { value?: number } }>; fare?: { value?: number } }> }
  const TravelMode: Record<string, string>;
  function importLibrary(name: string): Promise<Record<string, unknown>>;
}
declare namespace google.maps.places {
  interface PlaceData { id?: string; displayName?: { text?: string }; location?: LatLngLiteral; formattedAddress?: string; googleMapsURI?: string; types?: string[]; rating?: number; userRatingCount?: number; }
  class Place { static searchNearby(request: Record<string, unknown>): Promise<{ places?: PlaceData[] }>; }
}
interface Window { initTravelPickMap?: () => void; gm_authFailure?: () => void; }
interface Window { google?: typeof google; }
