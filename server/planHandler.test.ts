// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createPlanHandler, DEFAULT_MODEL, GROQ_URL } from './planHandler';

const KEY = 'test-key-not-real';

const body = (overrides: Record<string, unknown> = {}) => ({
  input: {
    interest: 'I want to learn UI animation',
    context: { outcome: 'Animate my portfolio', obstacle: "I don't know where to start", timeMinutes: 10 },
    clarification: null,
  },
  attempt: 0,
  exclude: [],
  allowClarification: true,
  ...overrides,
});

const post = (payload: unknown) =>
  new Request('http://localhost/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
    body: JSON.stringify(payload),
  });

const groqReply = (content: unknown, status = 200) =>
  new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), { status });

const goodOutput = {
  kind: 'suggestions',
  suggestions: [
    { trigger: 'When I finish breakfast', action: "I'll watch the first lesson of a free UI animation course", duration_minutes: 10, rationale: 'One lesson is a small start.' },
    { trigger: 'I close my laptop for the day', action: 'Recreate one simple hover animation', duration_minutes: 10, rationale: null },
  ],
  clarification: null,
};

describe('plan handler', () => {
  it('reports whether a key is configured, without revealing it', async () => {
    const configured = await createPlanHandler({ GROQ_API_KEY: KEY })(new Request('http://localhost/api/plan'));
    expect(await configured.json()).toEqual({ configured: true, model: DEFAULT_MODEL });
    const missing = await createPlanHandler({})(new Request('http://localhost/api/plan'));
    expect(await missing.json()).toEqual({ configured: false, model: null });
  });

  it('returns 503 when no key is configured', async () => {
    const response = await createPlanHandler({})(post(body()));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'not_configured' });
  });

  it('calls Groq with a strict schema and returns validated, normalised plans', async () => {
    const fetchMock = vi.fn().mockResolvedValue(groqReply(goodOutput));
    const response = await createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: fetchMock })(post(body()));
    expect(response.status).toBe(200);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(GROQ_URL);
    expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${KEY}`);
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({
      model: DEFAULT_MODEL,
      reasoning_effort: 'low',
      include_reasoning: false,
      response_format: { type: 'json_schema', json_schema: { strict: true } },
    });
    const userTurn = JSON.parse(sent.messages[1].content);
    expect(userTurn).toMatchObject({ interest: 'I want to learn UI animation', available_minutes: 10, may_ask_clarification: true });

    const { result, source } = await response.json();
    expect(source).toBe('ai');
    expect(result.kind).toBe('suggestions');
    expect(result.suggestions[0]).toMatchObject({
      trigger: 'I finish breakfast', // leading "When" removed
      action: 'Watch the first lesson of a free UI animation course', // leading "I'll" removed, capitalised for the card
      durationMinutes: 10,
    });
  });

  it('only allows a clarification when the client permits one', async () => {
    const fetchMock = vi.fn().mockResolvedValue(groqReply(goodOutput));
    await createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: fetchMock })(post(body({ allowClarification: false })));
    const schema = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string).response_format.json_schema.schema;
    expect(schema.properties.kind.enum).toEqual(['suggestions']);
    expect(schema.properties.clarification).toEqual({ type: 'null' });
  });

  it('passes a clarification question through', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      groqReply({ kind: 'clarification', suggestions: [], clarification: { question: 'Which kind of design?', options: ['Product design', 'Illustration'] } }),
    );
    const response = await createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: fetchMock })(post(body()));
    expect((await response.json()).result).toEqual({
      kind: 'clarification',
      clarification: { question: 'Which kind of design?', options: ['Product design', 'Illustration'] },
    });
  });

  it('retries once on an invalid answer, then reports invalid_response', async () => {
    const tooFew = { ...goodOutput, suggestions: [goodOutput.suggestions[0]] };
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(groqReply(tooFew)));
    const response = await createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: fetchMock })(post(body()));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'invalid_response' });
  });

  it('rejects plans that exceed the stated time limit', async () => {
    const tooLong = { ...goodOutput, suggestions: goodOutput.suggestions.map((s) => ({ ...s, duration_minutes: 25 })) };
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(groqReply(tooLong)));
    const response = await createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: fetchMock })(post(body()));
    expect(response.status).toBe(502);
  });

  it('maps upstream failures to generic codes and never echoes the key', async () => {
    const cases: [Response, number, string][] = [
      [new Response('{"error":{"message":"Invalid API Key"}}', { status: 401 }), 502, 'upstream_error'],
      [new Response('slow down', { status: 429 }), 429, 'rate_limited'],
      [new Response('oops', { status: 500 }), 502, 'upstream_error'],
    ];
    for (const [reply, status, code] of cases) {
      const response = await createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: vi.fn().mockResolvedValue(reply) })(post(body()));
      const text = await response.text();
      expect(response.status).toBe(status);
      expect(JSON.parse(text)).toEqual({ error: code });
      expect(text).not.toContain(KEY);
      expect(text).not.toContain('Invalid API Key');
    }
  });

  it('times out slow upstream calls', async () => {
    const hang = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const response = await createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: hang as unknown as typeof fetch, timeoutMs: 20 })(post(body()));
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: 'timeout' });
  });

  it('validates input before calling the model', async () => {
    const fetchMock = vi.fn();
    const handle = createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: fetchMock });
    const bad = [
      body({ input: { interest: '', context: { outcome: null, obstacle: null, timeMinutes: null } } }),
      body({ input: { interest: 'x'.repeat(281), context: { outcome: null, obstacle: null, timeMinutes: null } } }),
      body({ input: { interest: 'Learn', context: { outcome: null, obstacle: null, timeMinutes: 0 } } }),
      { nope: true },
    ];
    for (const payload of bad) expect((await handle(post(payload))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rate limits per client', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(groqReply(goodOutput)));
    const handle = createPlanHandler({ GROQ_API_KEY: KEY }, { fetch: fetchMock, rateLimit: 2 });
    expect((await handle(post(body()))).status).toBe(200);
    expect((await handle(post(body()))).status).toBe(200);
    expect((await handle(post(body()))).status).toBe(429);
  });
});
