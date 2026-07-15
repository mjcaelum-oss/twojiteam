import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

declare const process: { env: Record<string, string | undefined>; cwd(): string };

function recommendationsApi(): Plugin {
  return {
    name: 'recommendations-api',
    async configureServer(server) {
      // @ts-expect-error The Vercel handler is plain JavaScript without a declaration file.
      const { default: handler } = await import('./api/recommendations.js');
      server.middlewares.use('/api/recommendations', async (request, response, next) => {
        const apiRequest = request as typeof request & { method?: string; body: string; [Symbol.asyncIterator](): AsyncIterator<Uint8Array> };
        if (apiRequest.method !== 'POST' && apiRequest.method !== 'OPTIONS') return next();

        const chunks: string[] = [];
        for await (const chunk of apiRequest) chunks.push(String(chunk));
        apiRequest.body = chunks.join('');

        const apiResponse = {
          status(code: number) {
            response.statusCode = code;
            return apiResponse;
          },
          setHeader(name: string, value: string) {
            response.setHeader(name, value);
            return apiResponse;
          },
          send(body: string) {
            response.end(body);
          }
        };

        await handler(apiRequest, apiResponse);
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const langfuseEnv = loadEnv(mode, path.resolve(process.cwd(), 'langfuse'), '');
  if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (env.OPENAI_MODEL) process.env.OPENAI_MODEL = env.OPENAI_MODEL;
  for (const key of ['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY', 'LANGFUSE_BASE_URL']) {
    if (langfuseEnv[key]) process.env[key] = langfuseEnv[key];
  }
  return { plugins: [react(), recommendationsApi()] };
});
