import { createId } from '../src/lib/id.js';
import type { PlannerResult, PlanningInput } from '../src/features/planner/types.js';
import { InvalidPlannerResponse, validatePlannerResult } from '../src/features/planner/validatePlannerResult.js';
import { buildUserMessage, SYSTEM_PROMPT } from './prompt.js';
import { createRateLimiter } from './rateLimit.js';
import { planSchema, type ModelOutput } from './schema.js';

/**
 * Server-side planning endpoint (docs/ai-approach.md §4): validates input, calls Groq with a
 * strict JSON schema, validates the model's answer, and returns it. The API key never leaves
 * the server, request text is never logged, and upstream errors are reduced to generic codes.
 *
 * Web-standard Request → Response, so the same handler runs in Vercel (api/plan.ts) and in
 * the Vite dev server (vite.config.ts).
 */

export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const DEFAULT_MODEL = 'openai/gpt-oss-120b';

export interface PlanEnv {
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
}

export interface HandlerOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
  /** Requests per IP per minute. */
  rateLimit?: number;
}

export type PlanErrorCode =
  | 'not_configured'
  | 'bad_request'
  | 'rate_limited'
  | 'timeout'
  | 'upstream_error'
  | 'invalid_response'
  | 'method_not_allowed';

export interface PlanRequestBody {
  input: PlanningInput;
  attempt: number;
  exclude: string[];
  allowClarification: boolean;
}

const LIMITS = { interest: 280, context: 160, question: 200, answer: 160, exclude: 30, excludeItem: 200 };

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: PlanErrorCode,
  ) {
    super(code);
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function fail(status: number, code: PlanErrorCode): Response {
  return json(status, { error: code });
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

function text(value: unknown, max: number, { nullable }: { nullable: boolean }): string | null {
  if (value === null || value === undefined) {
    if (nullable) return null;
    throw new HttpError(400, 'bad_request');
  }
  if (typeof value !== 'string') throw new HttpError(400, 'bad_request');
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length > max) throw new HttpError(400, 'bad_request');
  if (trimmed === '') {
    if (nullable) return null;
    throw new HttpError(400, 'bad_request');
  }
  return trimmed;
}

export function parseRequestBody(raw: unknown): PlanRequestBody {
  if (typeof raw !== 'object' || raw === null) throw new HttpError(400, 'bad_request');
  const body = raw as Record<string, unknown>;
  const input = body.input as Record<string, unknown> | undefined;
  const context = input?.context as Record<string, unknown> | undefined;
  if (!input || !context) throw new HttpError(400, 'bad_request');

  const time = context.timeMinutes ?? null;
  if (time !== null && (typeof time !== 'number' || !Number.isInteger(time) || time < 1 || time > 240)) {
    throw new HttpError(400, 'bad_request');
  }

  let clarification: PlanningInput['clarification'] = null;
  if (input.clarification != null) {
    const c = input.clarification as Record<string, unknown>;
    const question = text(c.question, LIMITS.question, { nullable: true });
    const answer = text(c.answer, LIMITS.answer, { nullable: true });
    clarification = question && answer ? { question, answer } : null;
  }

  const attempt = body.attempt ?? 0;
  if (typeof attempt !== 'number' || !Number.isInteger(attempt) || attempt < 0 || attempt > 100) {
    throw new HttpError(400, 'bad_request');
  }
  const exclude = Array.isArray(body.exclude) ? body.exclude : [];
  if (exclude.length > 60 || exclude.some((e) => typeof e !== 'string' || e.length > LIMITS.excludeItem)) {
    throw new HttpError(400, 'bad_request');
  }

  return {
    input: {
      interest: text(input.interest, LIMITS.interest, { nullable: false })!,
      context: {
        outcome: text(context.outcome, LIMITS.context, { nullable: true }),
        obstacle: text(context.obstacle, LIMITS.context, { nullable: true }),
        timeMinutes: time as number | null,
      },
      clarification,
    },
    attempt,
    // Keep the most recent actions; older ones matter less and cost tokens.
    exclude: (exclude as string[]).slice(-LIMITS.exclude),
    allowClarification: body.allowClarification === true,
  };
}

// ---------------------------------------------------------------------------
// Model call
// ---------------------------------------------------------------------------

function toPlannerResult(output: ModelOutput, attempt: number): PlannerResult {
  if (output.kind === 'clarification' && output.clarification) {
    return validatePlannerResult({ kind: 'clarification', clarification: output.clarification });
  }
  return validatePlannerResult({
    kind: 'suggestions',
    suggestions: output.suggestions.map((s) => ({
      id: `ai-${attempt}-${createId()}`,
      trigger: s.trigger.replace(/^when\s+/i, ''),
      action: s.action.replace(/^i'?ll\s+/i, ''),
      durationMinutes: s.duration_minutes,
      rationale: s.rationale,
    })),
  });
}

/** Durations must respect a stated time limit ("30" means 30 or more, so it is not a cap). */
function respectsTimeLimit(result: PlannerResult, timeMinutes: number | null): boolean {
  if (result.kind !== 'suggestions' || timeMinutes === null || timeMinutes >= 30) return true;
  return result.suggestions.every((s) => s.durationMinutes <= timeMinutes);
}

async function callGroq(
  body: PlanRequestBody,
  env: Required<Pick<PlanEnv, 'GROQ_API_KEY'>> & PlanEnv,
  options: Required<Pick<HandlerOptions, 'fetch' | 'timeoutMs'>>,
  signal?: AbortSignal,
): Promise<PlannerResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), options.timeoutMs);
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await options.fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.GROQ_MODEL || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(body.input, body) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'action_plans', strict: true, schema: planSchema(body.allowClarification) },
        },
        reasoning_effort: 'low',
        include_reasoning: false,
        // "Show different ideas" asks for a little more variety.
        temperature: body.attempt > 0 ? 0.9 : 0.6,
        max_completion_tokens: 2048,
      }),
    });

    if (response.status === 429) throw new HttpError(429, 'rate_limited');
    if (!response.ok) throw new HttpError(502, 'upstream_error');

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new InvalidPlannerResponse('Empty model response.');
    const result = toPlannerResult(JSON.parse(content) as ModelOutput, body.attempt);
    if (!respectsTimeLimit(result, body.input.context.timeMinutes)) {
      throw new InvalidPlannerResponse('A suggestion exceeds the time limit.');
    }
    return result;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (controller.signal.aborted) throw new HttpError(504, 'timeout');
    if (error instanceof InvalidPlannerResponse || error instanceof SyntaxError) {
      throw new HttpError(502, 'invalid_response');
    }
    throw new HttpError(502, 'upstream_error');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
}

export function createPlanHandler(env: PlanEnv, options: HandlerOptions = {}) {
  const doFetch = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? 20_000;
  const allow = createRateLimiter({ limit: options.rateLimit ?? 20, windowMs: 60_000 });

  return async function handle(request: Request): Promise<Response> {
    const apiKey = env.GROQ_API_KEY?.trim();

    // GET reports whether live AI is available, so the client can pick a planner honestly.
    if (request.method === 'GET') {
      return json(200, { configured: Boolean(apiKey), model: apiKey ? env.GROQ_MODEL || DEFAULT_MODEL : null });
    }
    if (request.method !== 'POST') return fail(405, 'method_not_allowed');
    if (!apiKey) return fail(503, 'not_configured');
    if (!allow(clientKey(request))) return fail(429, 'rate_limited');

    try {
      let raw: unknown;
      try {
        raw = await request.json();
      } catch {
        throw new HttpError(400, 'bad_request');
      }
      const body = parseRequestBody(raw);
      const callEnv = { ...env, GROQ_API_KEY: apiKey };
      const callOptions = { fetch: doFetch, timeoutMs };

      let result: PlannerResult;
      try {
        result = await callGroq(body, callEnv, callOptions, request.signal);
      } catch (error) {
        // One retry when the model's answer didn't pass validation; never retry other failures.
        if (error instanceof HttpError && error.code === 'invalid_response') {
          result = await callGroq(body, callEnv, callOptions, request.signal);
        } else {
          throw error;
        }
      }
      return json(200, { result, source: 'ai' });
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.code);
      return fail(500, 'upstream_error');
    }
  };
}
