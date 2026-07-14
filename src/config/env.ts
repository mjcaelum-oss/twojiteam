const dataMode = import.meta.env.VITE_DATA_MODE === 'supabase' ? 'supabase' : 'mock';

export const env = {
  dataMode,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  recommendationAgentUrl: import.meta.env.VITE_RECOMMENDATION_AGENT_URL || '/api/recommendations',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  tourApiEnabled: import.meta.env.VITE_TOUR_API_ENABLED === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? ''
} as const;

export function validateEnv(): string[] {
  if (env.dataMode === 'supabase' && (!env.supabaseUrl || !env.supabaseAnonKey)) {
    return ['VITE_DATA_MODE=supabase requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'];
  }
  return [];
}
