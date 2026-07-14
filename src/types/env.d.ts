interface ImportMetaEnv {
  readonly VITE_DATA_MODE?: 'mock' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_RECOMMENDATION_AGENT_URL?: string;
  readonly VITE_TOUR_API_ENABLED?: string;
  readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
