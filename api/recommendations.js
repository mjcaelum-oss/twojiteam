/* global process, fetch */

const recommendationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['recommendations'],
  properties: {
    recommendations: {
      type: 'array',
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
    const candidates = input.spots.filter((spot) => !input.selectedIds?.includes(spot.id) && !input.rejectedIds?.includes(spot.id))
      .sort((a, b) => (Number(mealTime && b.category === 'food') - Number(mealTime && a.category === 'food')) || Number(b.category === input.preferences.style) - Number(a.category === input.preferences.style) || (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 20);
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        instructions: 'Choose up to 3 travel spots only from the supplied candidates. Strongly prioritize candidates whose category matches preferences.style. During 11:00-14:00 or 17:00-21:00, strongly prioritize food candidates such as restaurants, cafes, and bakeries because it is likely a meal time. Respect destination, travel style, pace, companion, selectedIds, rejectedIds, and previousSpotId. Never invent spot IDs. Return concise Korean reasons.',
        input: JSON.stringify({ destination: input.destination, preferences: input.preferences, recommendationTime: input.recommendationTime || null, selectedIds: input.selectedIds || [], rejectedIds: input.rejectedIds || [], previousSpotId: input.previousSpotId || null, spots: candidates }),
        text: { format: { type: 'json_schema', name: 'travel_recommendations', strict: true, schema: recommendationSchema } }
      })
    });
    const result = await openAiResponse.json();
    if (!openAiResponse.ok) return sendJson(response, openAiResponse.status, { error: result.error?.message || 'OpenAI request failed.' });
    const outputText = result.output_text || result.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
    const parsed = outputText ? JSON.parse(outputText) : null;
    const validIds = new Set(candidates.map((spot) => spot.id));
    const recommendations = (parsed?.recommendations || []).filter((item) => validIds.has(item.spotId)).slice(0, 3);
    return sendJson(response, 200, { recommendations });
  } catch (error) {
    return sendJson(response, 500, { error: error instanceof Error ? error.message : 'OpenAI recommendation failed.' });
  }
}
