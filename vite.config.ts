/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { planApiPlugin } from './server/vitePlanApi';

export default defineConfig(({ mode }) => {
  // '' prefix loads non-VITE_ variables for server-side use only; they are not exposed to the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), planApiPlugin({ GROQ_API_KEY: env.GROQ_API_KEY, GROQ_MODEL: env.GROQ_MODEL })],
    server: { port: 5173 },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
    },
  };
});
