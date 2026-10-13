import { defineConfig } from 'vitest/config';

/** Live planner evaluation only (npm run eval:planner); kept out of the normal test run. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.eval.ts'],
    reporters: ['verbose'],
    silent: false,
  },
});
