declare namespace google.maps {
  interface LatLngLiteral { lat: number; lng: number }
  interface LatLngBoundsLiteral { north: number; south: number; east: number; west: number }
  interface LatLng { lat(): number; lng(): number }
  class Map { constructor(element: HTMLElement, options?: { center?: LatLngLiteral; zoom?: number }); setCenter(center: LatLngLiteral): void; panTo(center: LatLngLiteral): void; setZoom(zoom: number): void; fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number): void; }
  class LatLngBounds { constructor(); extend(point: unknown): void; }
  class Marker { constructor(options: { map: Map; position: LatLngLiteral; title?: string; label?: string | { text: string; color?: string; fontWeight?: string }; icon?: { path: string; fillColor: string; fillOpacity: number; strokeColor: string; strokeWeight: number; scale: number } }); setMap(map: Map | null): void; setZIndex(index: number): void; }
  class InfoWindow { constructor(); setContent(content: string): void; open(map: Map, marker: Marker): void; }
  class Polyline { constructor(options?: { map?: Map; path?: unknown[]; geodesic?: boolean; strokeColor?: string; strokeOpacity?: number; strokeWeight?: number }); setMap(map: Map | null): void; }
  interface DirectionsRequest { origin: string | LatLngLiteral; destination: string | LatLngLiteral; travelMode: string; transitOptions?: { departureTime: Date }; }
  interface DirectionsLeg { distance?: { value?: number }; duration?: { value?: number }; }
  interface DirectionsRoute { legs: DirectionsLeg[]; fare?: { value?: number; currency?: string; text?: string }; }
  interface DirectionsResult { routes: DirectionsRoute[]; }
  class DirectionsService { route(request: DirectionsRequest): Promise<DirectionsResult>; }
  class DirectionsRenderer { constructor(options?: { map?: Map; suppressMarkers?: boolean; preserveViewport?: boolean; polylineOptions?: { strokeColor?: string; strokeOpacity?: number; strokeWeight?: number } }); setDirections(result: DirectionsResult): void; setMap(map: Map | null): void; }
  const TravelMode: Record<string, string>;
  function importLibrary(name: string): Promise<Record<string, unknown>>;
}
declare namespace google.maps.routes {
  interface ComputeRoutesRequest { origin: google.maps.LatLngLiteral | google.maps.places.Place; destination: google.maps.LatLngLiteral | google.maps.places.Place; travelMode: string; fields: string[]; departureTime?: Date; }
  interface RouteData { distanceMeters?: number; durationMillis?: number; path?: unknown[]; travelAdvisory?: { transitFare?: { units?: string; nanos?: number } }; createPolylines(): google.maps.Polyline[]; }
  class Route { static computeRoutes(request: ComputeRoutesRequest): Promise<{ routes?: RouteData[] }>; }
}
declare namespace google.maps.places {
  interface PlacePhoto { getURI(options?: { maxWidth?: number; maxHeight?: number }): string; }
  interface PlaceMoney { currencyCode?: string; units?: number | string; nanos?: number; }
  interface PlacePriceRange { startPrice?: PlaceMoney; endPrice?: PlaceMoney; }
  interface PlaceData { id?: string; displayName?: string; location?: google.maps.LatLng; formattedAddress?: string; googleMapsURI?: string; types?: string[]; photos?: PlacePhoto[]; rating?: number; userRatingCount?: number; priceRange?: PlacePriceRange; }
  class Place { constructor(options?: { id?: string }); static searchNearby(request: Record<string, unknown>): Promise<{ places?: PlaceData[] }>; }
}
interface Window { initTravelPickMap?: () => void; gm_authFailure?: () => void; }
interface Window { google?: typeof google; }
