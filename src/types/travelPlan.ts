export type TravelStyle = 'culture' | 'nature' | 'food' | 'activity';
export type TravelPace = 'slow' | 'balanced' | 'fast';
export type CompanionType = 'couple' | 'solo' | 'family' | 'friends';
export type TransportMode = 'DRIVING' | 'TRANSIT' | 'WALKING';

export interface TravelPreferences { style: TravelStyle; pace: TravelPace; companion: CompanionType; notes?: string; }
export interface Destination { name: string; latitude: number; longitude: number; }
export interface TravelPlanSpot { spot: import('./spot').Spot; visitOrder: number; travelDate?: string; transportMode?: TransportMode; arrivalAt?: string; departureAt?: string; }
export interface RouteSummary { durationMinutes: number; distanceMeters: number; cost: number | null; costCurrency?: string; costNote?: string; transitDetails?: string; error?: string; approximate?: boolean; }
export interface TravelPlan {
  id: string;
  title: string;
  destination: Destination;
  travelDate: string;
  startTime: string;
  returnDate?: string;
  dayStartTimes?: Record<string, string>;
  preferences: TravelPreferences;
  partySize: number;
  spots: TravelPlanSpot[];
  routes: (RouteSummary | null)[];
  status: 'draft' | 'complete';
}
