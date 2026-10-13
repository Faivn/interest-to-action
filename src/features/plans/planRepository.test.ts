import { describe, expect, it } from 'vitest';
import { parseCollection, StorageReadError } from '../../lib/localCollection';
import { createLocalPlanRepository, parsePlan, PLANS_STORAGE_KEY } from './planRepository';
import { createPlan } from './plansReducer';

const plan = createPlan(
  {
    interest: 'Learn UI animation',
    context: { outcome: 'Animate my portfolio', obstacle: null, timeMinutes: 20 },
    draft: { trigger: 'I finish breakfast', action: 'Watch one lesson', durationMinutes: 15 },
    rationale: 'Small start.',
    origin: 'suggested',
  },
  'id-1',
  '2026-10-13T09:00:00.000Z',
);

describe('local plan repository', () => {
  it('round-trips plans through storage', async () => {
    const repo = createLocalPlanRepository();
    expect(await repo.load()).toEqual([]);
    await repo.save([plan]);
    expect(JSON.parse(window.localStorage.getItem(PLANS_STORAGE_KEY)!)).toMatchObject({ version: 1 });
    expect(await repo.load()).toEqual([plan]);
  });

  it('drops malformed records instead of showing them', () => {
    const raw = JSON.stringify({
      version: 1,
      items: [plan, { id: 'x' }, { ...plan, id: 'y', durationMinutes: 0 }, { ...plan, id: 'z', status: 'later' }, null],
    });
    expect(parseCollection(raw, 1, parsePlan)).toEqual([plan]);
  });

  it('reports unreadable data rather than silently discarding it', () => {
    expect(() => parseCollection('{not json', 1, parsePlan)).toThrow(StorageReadError);
    expect(() => parseCollection(JSON.stringify({ version: 2, items: [] }), 1, parsePlan)).toThrow(StorageReadError);
  });
});
