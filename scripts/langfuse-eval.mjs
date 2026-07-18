/* global process, console, fetch */

import fs from 'node:fs';
import path from 'node:path';
import { LangfuseClient } from '@langfuse/client';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFile(path.resolve('langfuse/.env'));
loadEnvFile(path.resolve('.env'));

for (const key of ['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY', 'LANGFUSE_BASE_URL']) {
  if (!process.env[key]) throw new Error(`${key} is missing. Add it to langfuse/.env.`);
}

const datasetName = process.env.LANGFUSE_EVAL_DATASET || 'travel-recommendation-demo';
const recommendationUrl = process.env.RECOMMENDATION_URL || 'http://localhost:5173/api/recommendations';
const langfuse = new LangfuseClient({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || 'http://localhost:3000'
});

const spotSets = [
  { style: '문화', companion: '친구', mustMatch: '문화', spots: [['경복궁', '문화'], ['한강공원', '자연'], ['성수 카페거리', '카페'], ['남산타워', '전망'], ['광장시장', '음식']] },
  { style: '자연', companion: '연인', mustMatch: '자연', spots: [['서울숲', '자연'], ['국립중앙박물관', '문화'], ['익선동 카페', '카페'], ['롯데월드타워', '전망'], ['을지로 맛집', '음식']] },
  { style: '카페', companion: '혼자', mustMatch: '카페', spots: [['성수 카페거리', '카페'], ['북촌한옥마을', '문화'], ['청계천', '자연'], ['남산타워', '전망'], ['광장시장', '음식']] },
  { style: '음식', companion: '가족', mustMatch: '음식', spots: [['광장시장', '음식'], ['서울숲', '자연'], ['경복궁', '문화'], ['성수 카페거리', '카페'], ['남산타워', '전망']] },
  { style: '전망', companion: '연인', mustMatch: '전망', spots: [['남산타워', '전망'], ['한강공원', '자연'], ['경복궁', '문화'], ['익선동 카페', '카페'], ['을지로 맛집', '음식']] }
];

const items = spotSets.map((set, index) => {
  const spots = set.spots.map(([name, category]) => ({
    id: `eval-${index}-${category}`,
    name,
    region: '서울',
    category,
    venueType: category === '음식' ? 'restaurant' : category === '카페' ? 'cafe' : 'spot',
    tags: [category, set.companion],
    durationMinutes: 60,
    popularity: 80 - index
  }));
  return {
    input: {
      destination: '서울',
      preferences: { style: set.style, companion: set.companion, pace: 'slow', notes: '평가용 추천 테스트' },
      recommendationTime: '14:30',
      spots
    },
    expectedOutput: { mustMatch: set.mustMatch }
  };
});

async function ensureDataset() {
  try {
    await langfuse.api.datasets.create({
      name: datasetName,
      description: 'Travel Pick recommendation quality demo dataset',
      metadata: { purpose: 'screenshot-demo' }
    });
    console.log(`Created dataset: ${datasetName}`);
  } catch (error) {
    if (!String(error?.message || error).toLowerCase().includes('already')) throw error;
    console.log(`Using existing dataset: ${datasetName}`);
  }

  for (const [index, item] of items.entries()) {
    await langfuse.dataset.createItem({
      id: `travel-eval-${index + 1}`,
      datasetName,
      input: item.input,
      expectedOutput: item.expectedOutput,
      metadata: { source: 'langfuse-eval-script' }
    });
  }
}

async function run() {
  await ensureDataset();
  const dataset = await langfuse.dataset.get(datasetName);
  const result = await dataset.runExperiment({
    name: 'Travel recommendation quality',
    runName: `travel-recommendation-${new Date().toISOString().slice(0, 19).replaceAll(':', '-')}`,
    description: 'Checks whether recommendation output contains the preferred category.',
    maxConcurrency: 1,
    task: async ({ input }) => {
      const response = await fetch(recommendationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Recommendation API failed (${response.status})`);
      return body;
    },
    evaluators: [async ({ input, output, expectedOutput }) => {
      const spotById = new Map(input.spots.map((spot) => [spot.id, spot]));
      const passed = output.recommendations?.some(({ spotId }) => spotById.get(spotId)?.category === expectedOutput.mustMatch) ?? false;
      return {
        name: 'preferred_category_match',
        value: passed ? 1 : 0,
        comment: passed ? `통과: ${expectedOutput.mustMatch} 카테고리 포함` : `실패: ${expectedOutput.mustMatch} 카테고리 없음`
      };
    }],
    runEvaluators: [async ({ itemResults }) => {
      const scores = itemResults.map((item) => item.evaluations?.[0]?.value ?? 0);
      const passRate = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      return { name: 'pass_rate', value: passRate, comment: `${Math.round(passRate * 100)}% (${scores.filter(Boolean).length}/${scores.length})` };
    }]
  });

  console.log(await result.format({ includeItemResults: true }));
  console.log(`Dataset: ${process.env.LANGFUSE_BASE_URL || 'http://localhost:3000'}`);
  console.log(`Open ${process.env.LANGFUSE_BASE_URL || 'http://localhost:3000'} → Datasets → ${datasetName} → Runs`);
  await langfuse.shutdown();
}

run().catch(async (error) => {
  console.error(error);
  await langfuse.shutdown();
  process.exitCode = 1;
});
