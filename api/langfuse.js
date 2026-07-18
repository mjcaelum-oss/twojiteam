/* global process */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { startActiveObservation, startObservation } from '@langfuse/tracing';

const enabled = Boolean(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);

const processor = enabled
  ? new LangfuseSpanProcessor({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'http://localhost:3000'
    })
  : null;

const sdk = processor ? new NodeSDK({ spanProcessors: [processor] }) : null;
if (sdk) sdk.start();

export async function withRecommendationTrace(input, task) {
  if (!processor) return task(null);

  return startActiveObservation('travel-recommendation', async (trace) => {
    trace.update({
      input,
      metadata: { application: 'travel-pick', feature: 'recommendations' }
    });

    const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
    const generation = startObservation(
      'openai-recommendation',
      { model, input },
      { asType: 'generation' }
    );

    try {
      const result = await task(generation);
      trace.update({ output: result });
      return result;
    } catch (error) {
      generation.update({ level: 'ERROR', statusMessage: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      generation.end();
    }
  });
}

export async function flushLangfuse() {
  if (processor) await processor.forceFlush();
}

export { enabled as langfuseEnabled };
