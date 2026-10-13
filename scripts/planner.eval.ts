// @vitest-environment node
/**
 * Live evaluation of the Groq planner against docs/ai-approach.md §9.
 * Run with: npm run eval:planner   (needs GROQ_API_KEY in .env.local; makes a few real API calls)
 * Prints each result for a human to judge relevance and specificity, and checks the hard rules.
 */
import { describe, expect, it } from 'vitest';
import { loadEnv } from 'vite';
import { formatPlanSentence } from '../src/features/plans/types';
import type { PlannerResult } from '../src/features/planner/types';
import { createPlanHandler } from '../server/planHandler';

const env = loadEnv('development', process.cwd(), '');
const handle = createPlanHandler({ GROQ_API_KEY: env.GROQ_API_KEY, GROQ_MODEL: env.GROQ_MODEL }, { rateLimit: 100 });

async function plan(interest: string, context: Partial<{ outcome: string; obstacle: string; timeMinutes: number }> = {}, extra: Record<string, unknown> = {}) {
  const response = await handle(
    new Request('http://localhost/api/plan', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        input: { interest, context: { outcome: null, obstacle: null, timeMinutes: null, ...context }, clarification: null },
        attempt: 0,
        exclude: [],
        allowClarification: true,
        ...extra,
      }),
    }),
  );
  const data = (await response.json()) as { result?: PlannerResult; error?: string };
  print(interest, response.status, data);
  return { status: response.status, ...data };
}

function print(interest: string, status: number, data: { result?: PlannerResult; error?: string }) {
  const lines = [`\n## ${interest}  →  ${status}`];
  if (data.error) lines.push(`  error: ${data.error}`);
  if (data.result?.kind === 'clarification') {
    lines.push(`  ? ${data.result.clarification.question}  [${data.result.clarification.options.join(' | ')}]`);
  }
  if (data.result?.kind === 'suggestions') {
    for (const s of data.result.suggestions) lines.push(`  - ${formatPlanSentence(s)}\n      why: ${s.rationale ?? '—'}`);
  }
  console.log(lines.join('\n'));
}

describe.skipIf(!env.GROQ_API_KEY)('Groq planner (live)', { timeout: 60_000 }, () => {
  it('A: broad interest gets beginner-friendly options or one clarifying question', async () => {
    const r = await plan('I want to learn Python.');
    expect(r.status).toBe(200);
  });

  it('B: limited time is respected', async () => {
    const r = await plan('I want to learn UI animation', { timeMinutes: 10 });
    expect(r.status).toBe(200);
    if (r.result?.kind === 'suggestions') expect(r.result.suggestions.every((s) => s.durationMinutes <= 10)).toBe(true);
  });

  it('C: unclear intention asks for clarification', async () => {
    const r = await plan('I want to do something with design.');
    expect(r.status).toBe(200);
    expect(r.result?.kind).toBe('clarification');
  });

  it('D: rejected suggestions lead to genuinely different ideas', async () => {
    const first = await plan('Write a short story', { obstacle: "I'm scared it won't be good" }, { allowClarification: false });
    const shown = first.result?.kind === 'suggestions' ? first.result.suggestions.map((s) => s.action) : [];
    const second = await plan('Write a short story', { obstacle: "I'm scared it won't be good" }, { allowClarification: false, attempt: 1, exclude: shown });
    expect(second.status).toBe(200);
    if (second.result?.kind === 'suggestions') {
      for (const s of second.result.suggestions) expect(shown).not.toContain(s.action);
    }
  });

  it('E: a failing provider returns a clean error', async () => {
    const broken = createPlanHandler({ GROQ_API_KEY: 'invalid-key-for-eval' });
    const response = await broken(
      new Request('http://localhost/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: { interest: 'Learn Spanish', context: { outcome: null, obstacle: null, timeMinutes: null }, clarification: null } }),
      }),
    );
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'upstream_error' });
  });
});
