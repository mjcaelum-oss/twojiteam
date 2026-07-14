import { env } from '../../config/env';
import type { ScoredSpot } from '../../features/recommendations/recommendation.types';
import type { Spot } from '../../types/spot';
import type { Destination, TravelPreferences } from '../../types/travelPlan';

export interface AgentRecommendation { spotId: string; reason: string; }
export interface RecommendationAgentResponse { recommendations: AgentRecommendation[]; }
export interface RecommendationAgentInput { destination: Destination; preferences: TravelPreferences; spots: Spot[]; selectedIds: string[]; rejectedIds: string[]; previousSpotId?: string; }

export async function recommendWithAgent(input: RecommendationAgentInput): Promise<RecommendationAgentResponse> {
  if (!env.recommendationAgentUrl) throw new Error('VITE_RECOMMENDATION_AGENT_URL이 설정되지 않았습니다. GPT API 키를 보관하는 서버 endpoint를 연결하세요.');
  const response = await fetch(env.recommendationAgentUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error(`추천 agent 요청에 실패했습니다 (${response.status}).`);
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !Array.isArray((result as RecommendationAgentResponse).recommendations)) throw new Error('추천 agent 응답 형식이 올바르지 않습니다.');
  return result as RecommendationAgentResponse;
}

export function agentRecommendationsToSpots(response: RecommendationAgentResponse, spots: Spot[]): ScoredSpot[] {
  const byId = new Map(spots.map((spot) => [spot.id, spot]));
  return response.recommendations.flatMap(({ spotId, reason }, index) => { const spot = byId.get(spotId); return spot ? [{ ...spot, score: response.recommendations.length - index, reason }] : []; });
}
