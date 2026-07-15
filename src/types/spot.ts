import type { TravelStyle } from './travelPlan';

export interface OpeningHours {
  weekly: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, { open: string; close: string } | null>>;
  closedDates?: string[];
  note?: string;
}

export interface Spot {
  id: string;
  name: string;
  address?: string;
  region: string;
  latitude: number;
  longitude: number;
  category: TravelStyle;
  tags: string[];
  description: string;
  photoUrl?: string;
  feeAmount: number;
  feeNote: string;
  feeCurrency?: string;
  durationMinutes: number;
  openingHours: OpeningHours;
  popularity: number;
  source: 'mock' | 'tourapi' | 'places' | 'supabase';
  sourceUrl?: string;
  lastVerifiedAt?: string;
}

export interface Region { id: string; name: string; latitude: number; longitude: number; }
