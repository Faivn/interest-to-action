import type { Planner, PlannerResult, PlanningInput, SuggestOptions } from './types';

export class PlannerRequestError extends Error {
  constructor(readonly code: string) {
    super(`Planner request failed: ${code}`);
    this.name = 'PlannerRequestError';
  }
}

/**
 * Calls the server-side planning endpoint (server/planHandler.ts), which talks to Groq.
 * The response is validated again by the planning flow before anything is shown.
 */
export function createHttpPlanner({ endpoint = '/api/plan', timeoutMs = 25_000 } = {}): Planner {
  return {
    source: 'ai',
    async suggest(input: PlanningInput, options: SuggestOptions): Promise<PlannerResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const onAbort = () => controller.abort();
      options.signal?.addEventListener('abort', onAbort);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            input,
            attempt: options.attempt,
            exclude: options.exclude,
            allowClarification: options.allowClarification,
          }),
        });
        const data = (await response.json().catch(() => null)) as { result?: PlannerResult; error?: string } | null;
        if (!response.ok || !data?.result) throw new PlannerRequestError(data?.error ?? `http_${response.status}`);
        return data.result;
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', onAbort);
      }
    },
  };
}

/** Asks the server whether a live model is configured. Any failure means "no". */
export async function isLivePlannerAvailable(endpoint = '/api/plan', timeoutMs = 2000): Promise<boolean> {
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return false;
    const data = (await response.json()) as { configured?: boolean };
    return data.configured === true;
  } catch {
    return false;
  }
}
