const dataMode = import.meta.env.PROD || import.meta.env.VITE_DATA_MODE === 'supabase' ? 'supabase' : 'mock';
const configuredOpenAIRecommendationUrl = import.meta.env.VITE_OPENAI_RECOMMENDATION_URL?.trim() ?? '';
const validOpenAIRecommendationUrl = configuredOpenAIRecommendationUrl === '' || configuredOpenAIRecommendationUrl === '/api/recommendations' || /^https?:\/\/[^\s]+$/.test(configuredOpenAIRecommendationUrl);
const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '') ?? '';
const supabaseUrl = configuredSupabaseUrl.replace(/\/rest\/v1$/, '');

export const env = {
  dataMode,
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  openAIRecommendationUrl: validOpenAIRecommendationUrl ? configuredOpenAIRecommendationUrl || '/api/recommendations' : '/api/recommendations',
  supabaseUrl,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  tourApiEnabled: import.meta.env.VITE_TOUR_API_ENABLED === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? ''
} as const;

export function validateEnv(): string[] {
  if (env.dataMode === 'supabase' && (!env.supabaseUrl || !env.supabaseAnonKey)) {
    return ['Supabase mode requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'];
  }
  return [];
}
