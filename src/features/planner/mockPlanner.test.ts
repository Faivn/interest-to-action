import { describe, expect, it } from 'vitest';
import { EMPTY_CONTEXT } from '../plans/types';
import { composeSuggestions, createMockPlanner, interpretInterest } from './mockPlanner';
import type { PlanningInput } from './types';
import { validatePlannerResult } from './validatePlannerResult';

const input = (interest: string, context: Partial<PlanningInput['context']> = {}, answer?: string): PlanningInput => ({
  interest,
  context: { ...EMPTY_CONTEXT, ...context },
  clarification: answer ? { question: 'Q?', answer } : null,
});

const first = { attempt: 0, exclude: [] as string[] };
const planner = createMockPlanner({ latencyMs: 0 });

describe('interpretInterest', () => {
  it.each([
    ['I want to learn UI animation', 'learn', 'UI animation'],
    ['I want to learn Python.', 'learn', 'Python'],
    ["I've been meaning to write a short story", 'do', 'write a short story'],
    ['Learn how to cook Thai food', 'do', 'cook Thai food'],
    ['Learn to bake sourdough', 'do', 'bake sourdough'],
    ["I'm curious about pottery", 'learn', 'pottery'],
    ['Pottery', 'learn', 'pottery'],
    ['Python', 'learn', 'Python'],
    ['Practise Japanese every day', 'do', 'practise Japanese'],
  ])('reads %j as %s "%s"', (text, kind, subject) => {
    expect(interpretInterest(text)).toMatchObject({ kind, subject, vague: false });
  });

  it('separates a time constraint from the interest (AI Test B)', () => {
    expect(interpretInterest('I want to learn UI animation, but I only have 10 minutes available.')).toMatchObject({
      subject: 'UI animation',
      statedMinutes: 10,
    });
  });

  it.each(['I want to do something with design', 'get better at things', 'be more productive'])('flags %j as too broad', (text) => {
    expect(interpretInterest(text).vague).toBe(true);
  });
});

describe('mock planner', () => {
  it('offers beginner-friendly, on-topic plans for a broad interest (AI Test A)', async () => {
    const result = validatePlannerResult(await planner.suggest(input('I want to learn Python'), { ...first, allowClarification: true }));
    expect(result.kind).toBe('suggestions');
    if (result.kind !== 'suggestions') return;
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    for (const s of result.suggestions) expect(s.action).toContain('Python');
  });

  it('fits every plan inside the stated time (AI Test B)', () => {
    const list = composeSuggestions(input('I want to learn UI animation, but I only have 10 minutes available.'), first);
    expect(list.every((s) => s.durationMinutes <= 10)).toBe(true);
    expect(list.every((s) => s.action.includes('UI animation'))).toBe(true);
  });

  it('respects the time chosen in context', () => {
    const list = composeSuggestions(input('Learn to play the guitar', { timeMinutes: 5 }), first);
    expect(list.every((s) => s.durationMinutes <= 5)).toBe(true);
  });

  it('asks one clarification question for an unclear interest (AI Test C)', async () => {
    const result = await planner.suggest(input('I want to do something with design'), { ...first, allowClarification: true });
    expect(result).toEqual({
      kind: 'clarification',
      clarification: expect.objectContaining({ question: 'What kind of design interests you most?' }),
    });
  });

  it('plans from the clarification answer and never asks twice', async () => {
    const result = await planner.suggest(input('I want to do something with design', {}, 'Product design'), {
      ...first,
      allowClarification: true,
    });
    expect(result.kind).toBe('suggestions');
    if (result.kind === 'suggestions') expect(result.suggestions[0].action).toContain('product design');
  });

  it('addresses the stated obstacle and links to the outcome', () => {
    const list = composeSuggestions(
      input('Learn UI animation', { obstacle: "I don't know where to start", outcome: 'Animate my portfolio' }),
      first,
    );
    expect(list[0].rationale).toContain('“Animate my portfolio”');
    expect(list.some((s) => s.rationale?.includes('one clear first step'))).toBe(true);
  });

  it('gives genuinely different ideas when asked again', () => {
    const a = composeSuggestions(input('Learn UI animation'), first);
    const b = composeSuggestions(input('Learn UI animation'), { attempt: 1, exclude: a.map((s) => s.action) });
    expect(b.some((s) => !a.map((x) => x.action).includes(s.action))).toBe(true);
    expect(new Set(b.map((s) => s.action)).size).toBe(b.length);
  });

  it('uses distinct triggers within one set', () => {
    const list = composeSuggestions(input('Write a short story'), first);
    expect(new Set(list.map((s) => s.trigger)).size).toBe(list.length);
  });
});
