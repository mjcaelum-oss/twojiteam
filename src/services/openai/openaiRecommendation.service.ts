import { env } from '../../config/env';
import type { ScoredSpot } from '../../features/recommendations/recommendation.types';
import type { Spot } from '../../types/spot';
import type { Destination, TravelPreferences } from '../../types/travelPlan';

export interface OpenAIRecommendation { spotId: string; reason: string; }
export interface OpenAIRecommendationResponse { recommendations: OpenAIRecommendation[]; }
export interface OpenAIRecommendationInput { destination: Destination; preferences: TravelPreferences; spots: Spot[]; selectedIds: string[]; rejectedIds: string[]; previousSpotId?: string; }

export async function requestOpenAIRecommendations(input: OpenAIRecommendationInput): Promise<OpenAIRecommendationResponse> {
  const response = await fetch(env.openAIRecommendationUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error(`OpenAI 추천 요청에 실패했습니다 (${response.status}).`);
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !Array.isArray((result as OpenAIRecommendationResponse).recommendations)) throw new Error('OpenAI 추천 응답 형식이 올바르지 않습니다.');
  return result as OpenAIRecommendationResponse;
}

export function openAIRecommendationsToSpots(response: OpenAIRecommendationResponse, spots: Spot[]): ScoredSpot[] {
  const byId = new Map(spots.map((spot) => [spot.id, spot]));
  return response.recommendations.flatMap(({ spotId, reason }, index) => { const spot = byId.get(spotId); return spot ? [{ ...spot, score: response.recommendations.length - index, reason }] : []; });
}
