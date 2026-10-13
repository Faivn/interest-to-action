import { describe, expect, it } from 'vitest';
import { createPlan, plansReducer, selectCompleted, selectCurrent } from './plansReducer';
import { EMPTY_CONTEXT, formatPlanSentence, validateDraft } from './types';

const T0 = '2026-10-13T09:00:00.000Z';
const T1 = '2026-10-13T10:00:00.000Z';
const T2 = '2026-10-13T11:00:00.000Z';

const make = (id: string) =>
  createPlan(
    {
      interest: `Interest ${id}`,
      context: EMPTY_CONTEXT,
      draft: { trigger: 'I finish breakfast', action: 'Read one page', durationMinutes: 10 },
      rationale: null,
      origin: 'suggested',
    },
    id,
    T0,
  );

describe('plansReducer', () => {
  it('saves new plans as not started, newest first, with tidy text', () => {
    const plan = createPlan(
      {
        interest: '  Learn   UI animation ',
        context: EMPTY_CONTEXT,
        draft: { trigger: ' After lunch ', action: 'Watch  one lesson', durationMinutes: 15 },
        rationale: 'Small start.',
        origin: 'edited',
      },
      'a',
      T0,
    );
    expect(plan).toMatchObject({ interest: 'Learn UI animation', trigger: 'After lunch', action: 'Watch one lesson', status: 'not-started' });
    expect(plansReducer([make('b')], { type: 'added', plan }).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('marks a plan as edited when its If–Then details change', () => {
    const [edited] = plansReducer([make('a')], {
      type: 'edited',
      id: 'a',
      draft: { trigger: 'After lunch', action: 'Sketch one idea', durationMinutes: 20 },
      now: T1,
    });
    expect(edited).toMatchObject({ origin: 'edited', action: 'Sketch one idea', updatedAt: T1, interest: 'Interest a' });
  });

  it('tracks progress without removing the plan', () => {
    let state = [make('a')];
    state = plansReducer(state, { type: 'statusSet', id: 'a', status: 'in-progress', now: T1 });
    expect(state[0]).toMatchObject({ status: 'in-progress', completedAt: null });
    state = plansReducer(state, { type: 'statusSet', id: 'a', status: 'completed', now: T2 });
    expect(state[0]).toMatchObject({ status: 'completed', completedAt: T2, interest: 'Interest a' });
  });

  it('removes and restores a plan at its original position', () => {
    const initial = [make('a'), make('b'), make('c')];
    const removed = plansReducer(initial, { type: 'removed', id: 'b' });
    expect(removed.map((p) => p.id)).toEqual(['a', 'c']);
    expect(plansReducer(removed, { type: 'restored', plan: initial[1], index: 1 }).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('splits current and completed plans', () => {
    let state = [make('a'), make('b'), make('c')];
    state = plansReducer(state, { type: 'statusSet', id: 'a', status: 'completed', now: T1 });
    state = plansReducer(state, { type: 'statusSet', id: 'c', status: 'completed', now: T2 });
    expect(selectCurrent(state).map((p) => p.id)).toEqual(['b']);
    expect(selectCompleted(state).map((p) => p.id)).toEqual(['c', 'a']);
  });
});

describe('plan sentence', () => {
  it.each([
    [{ trigger: 'I finish breakfast', action: 'Practise one UI animation', durationMinutes: 15 }, "When I finish breakfast, I'll practise one UI animation for 15 minutes."],
    [{ trigger: 'After lunch', action: "I'll read one page", durationMinutes: 1 }, "After lunch, I'll read one page for 1 minute."],
    [{ trigger: 'when the kettle boils.', action: 'UI sketch warm-up', durationMinutes: 5 }, "When the kettle boils, I'll UI sketch warm-up for 5 minutes."],
  ])('formats %j', (draft, expected) => {
    expect(formatPlanSentence(draft)).toBe(expected);
  });

  it('requires a trigger, an action and a positive whole number of minutes', () => {
    expect(validateDraft({ trigger: ' ', action: '', durationMinutes: Number.NaN })).toEqual({
      trigger: expect.any(String),
      action: expect.any(String),
      durationMinutes: expect.any(String),
    });
    expect(validateDraft({ trigger: 'After lunch', action: 'Read', durationMinutes: 10 })).toEqual({});
  });
});
