import type { Spot } from '../../types/spot';
import type { TravelPace } from '../../types/travelPlan';
import type { RecommendationContext, ScoredSpot } from './recommendation.types';

const maxLegMinutes: Record<TravelPace, number> = { slow: 30, balanced: 50, fast: 90 };
const distanceKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const rad = Math.PI / 180;
  const x = (b.longitude - a.longitude) * rad * Math.cos(((a.latitude + b.latitude) / 2) * rad);
  const y = (b.latitude - a.latitude) * rad;
  return Math.sqrt(x * x + y * y) * 6371;
};

export function scoreSpot(spot: Spot, context: RecommendationContext): ScoredSpot {
  const anchor = context.previous ?? context.destination;
  const km = distanceKm(anchor, spot);
  const estimatedMinutes = km * 3 + 5;
  const style = spot.category === context.preferences.style || spot.tags.includes(context.preferences.style) ? 8 : 0;
  const companion = spot.tags.includes(context.preferences.companion) ? 2 : 0;
  const popularity = spot.popularity * 2;
  const distancePenalty = Math.min(1, estimatedMinutes / maxLegMinutes[context.preferences.pace]) * 6;
  const score = style + companion + popularity - distancePenalty;
  const reason = style ? `${context.preferences.style === 'culture' ? '문화·역사' : context.preferences.style === 'nature' ? '자연·풍경' : context.preferences.style === 'food' ? '맛집·카페' : '체험'} 취향과 잘 맞아요` : `이동하기 좋은 ${km.toFixed(1)}km 거리예요`;
  return { ...spot, score, reason, distanceKm: km };
}

export function getRecommendations(spots: Spot[], context: RecommendationContext, limit = 3): ScoredSpot[] {
  return spots.filter((spot) => !context.selectedIds.includes(spot.id) && !context.rejectedIds.includes(spot.id))
    .map((spot) => scoreSpot(spot, context)).filter((spot) => spot.score > -4)
    .sort((a, b) => b.score - a.score).slice(0, limit);
}
