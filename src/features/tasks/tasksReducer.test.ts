import { describe, expect, it } from 'vitest';
import { createTask, selectActive, selectCompleted, tasksReducer } from './tasksReducer';

const T0 = '2026-10-13T09:00:00.000Z';
const T1 = '2026-10-13T10:00:00.000Z';
const T2 = '2026-10-13T11:00:00.000Z';

const make = (id: string, title = id) => createTask({ title, when: '', durationMinutes: null }, id, T0);

describe('tasksReducer', () => {
  it('adds new tasks to the top and trims input', () => {
    const task = createTask({ title: '  Read a chapter  ', when: '  ', durationMinutes: 10 }, 'a', T0);
    expect(task).toMatchObject({ title: 'Read a chapter', when: null, durationMinutes: 10, status: 'active' });
    const state = tasksReducer([make('b')], { type: 'added', task });
    expect(state.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('edits only the targeted task', () => {
    const state = tasksReducer([make('a'), make('b')], {
      type: 'edited',
      id: 'b',
      draft: { title: 'Sketch', when: 'After lunch', durationMinutes: 20 },
      now: T1,
    });
    expect(state[0].title).toBe('a');
    expect(state[1]).toMatchObject({ title: 'Sketch', when: 'After lunch', durationMinutes: 20, updatedAt: T1 });
  });

  it('completes and reopens a task, tracking completedAt', () => {
    const done = tasksReducer([make('a')], { type: 'statusSet', id: 'a', completed: true, now: T1 });
    expect(done[0]).toMatchObject({ status: 'completed', completedAt: T1 });
    const reopened = tasksReducer(done, { type: 'statusSet', id: 'a', completed: false, now: T2 });
    expect(reopened[0]).toMatchObject({ status: 'active', completedAt: null });
  });

  it('removes and restores a task at its original position', () => {
    const initial = [make('a'), make('b'), make('c')];
    const removed = tasksReducer(initial, { type: 'removed', id: 'b' });
    expect(removed.map((t) => t.id)).toEqual(['a', 'c']);
    const restored = tasksReducer(removed, { type: 'restored', task: initial[1], index: 1 });
    expect(restored.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    // Restoring twice is a no-op.
    expect(tasksReducer(restored, { type: 'restored', task: initial[1], index: 1 })).toBe(restored);
  });

  it('selects active tasks and orders completed ones by most recent', () => {
    let state = [make('a'), make('b'), make('c')];
    state = tasksReducer(state, { type: 'statusSet', id: 'a', completed: true, now: T1 });
    state = tasksReducer(state, { type: 'statusSet', id: 'c', completed: true, now: T2 });
    expect(selectActive(state).map((t) => t.id)).toEqual(['b']);
    expect(selectCompleted(state).map((t) => t.id)).toEqual(['c', 'a']);
  });
});
