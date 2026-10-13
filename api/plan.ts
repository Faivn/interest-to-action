// Vercel compiles each file to Node ESM, so relative imports on this path need explicit .js extensions.
import { createPlanHandler } from '../server/planHandler.js';

/**
 * Vercel Function: /api/plan
 * Set GROQ_API_KEY (and optionally GROQ_MODEL) in the Vercel project's Environment Variables.
 */
export const config = { maxDuration: 30 };

const handle = createPlanHandler({ GROQ_API_KEY: process.env.GROQ_API_KEY, GROQ_MODEL: process.env.GROQ_MODEL });

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}
