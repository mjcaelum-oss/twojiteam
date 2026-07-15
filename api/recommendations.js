/* global process, fetch */

const recommendationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['recommendations'],
  properties: {
    recommendations: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['spotId', 'reason'],
        properties: { spotId: { type: 'string' }, reason: { type: 'string' } }
      }
    }
  }
};

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function preferenceScore(spot, preferences) {
  let score = 0;
  if (spot.category === preferences.style) score += 100;
  if (spot.tags?.includes(preferences.style)) score += 25;
  if (spot.tags?.includes(preferences.companion)) score += 20;
  if (preferences.pace === 'slow' && spot.durationMinutes >= 90) score += 10;
  if (preferences.pace === 'fast' && spot.durationMinutes <= 90) score += 10;
  return score;
}

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') return response.status(204).send('');
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'POST only' });
  if (!process.env.OPENAI_API_KEY) return sendJson(response, 500, { error: 'OPENAI_API_KEY is not configured on the server.' });

  try {
    const input = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    if (!input?.destination || !input?.preferences || !Array.isArray(input.spots)) return sendJson(response, 400, { error: 'destination, preferences, and spots are required.' });
    const time = input.recommendationTime ? input.recommendationTime.split(':').map(Number) : [];
    const minutes = time.length >= 2 ? time[0] * 60 + time[1] : -1;
    const mealTime = (minutes >= 660 && minutes <= 840) || (minutes >= 1020 && minutes <= 1260);
    const candidates = input.spots.filter((spot) => !input.selectedIds?.includes(spot.id) && !input.rejectedIds?.includes(spot.id) && !(input.previousVenueType === 'restaurant' && spot.venueType === 'restaurant'))
      .sort((a, b) => (preferenceScore(b, input.preferences) - preferenceScore(a, input.preferences)) || (Number(mealTime && b.category === 'food') - Number(mealTime && a.category === 'food')) || (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20);
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        instructions: 'Act as a preference-first travel planner. First evaluate every supplied candidate against the user profile, then rank them with this order: hard exclusions, preferred style/category, companion fit, pace fit, meal-time fit, distance/popularity. Return exactly 5 recommendations when at least 5 candidates are supplied, and fewer only when fewer than 5 remain. Strongly prioritize preferences.style, preferences.companion, preferences.pace, and preferences.notes; do not treat them as optional context. If the previous venue type is restaurant, do not recommend another restaurant immediately; cafes are separate and remain eligible. During 11:00-14:00 or 17:00-21:00, strongly prioritize food candidates such as restaurants, cafes, and bakeries because it is likely a meal time. Respect destination, selectedIds, rejectedIds, previousSpotId, and previousVenueType. Never invent spot IDs or recommend excluded candidates. Return concise Korean reasons that mention the matching preference when possible.',
        input: JSON.stringify({ destination: input.destination, preferences: input.preferences, recommendationTime: input.recommendationTime || null, selectedIds: input.selectedIds || [], rejectedIds: input.rejectedIds || [], previousSpotId: input.previousSpotId || null, previousVenueType: input.previousVenueType || null, spots: candidates }),
        text: { format: { type: 'json_schema', name: 'travel_recommendations', strict: true, schema: recommendationSchema } }
      })
    });
    const result = await openAiResponse.json();
    if (!openAiResponse.ok) return sendJson(response, openAiResponse.status, { error: result.error?.message || 'OpenAI request failed.' });
    const outputText = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
    const parsed = outputText ? JSON.parse(outputText) : null;
    const validIds = new Set(candidates.map((spot) => spot.id));
    const recommendations = [];
    const seen = new Set();
    for (const item of parsed?.recommendations || []) {
      if (validIds.has(item.spotId) && !seen.has(item.spotId)) {
        recommendations.push(item);
        seen.add(item.spotId);
      }
    }
    for (const spot of candidates) {
      if (recommendations.length >= 5) break;
      if (!seen.has(spot.id)) {
        recommendations.push({ spotId: spot.id, reason: '선택한 여행 성향에 맞는 후보예요.' });
        seen.add(spot.id);
      }
    }
    const spotsById = new Map(candidates.map((spot) => [spot.id, spot]));
    recommendations.sort((a, b) => preferenceScore(spotsById.get(b.spotId), input.preferences) - preferenceScore(spotsById.get(a.spotId), input.preferences));
    return sendJson(response, 200, { recommendations });
  } catch (error) {
    return sendJson(response, 500, { error: error instanceof Error ? error.message : 'OpenAI recommendation failed.' });
  }
}
