import { describe, expect, it } from 'vitest';
import { createLocalTaskRepository, parsePayload, StorageReadError, STORAGE_KEY } from './taskRepository';
import { createTask } from './tasksReducer';

const task = createTask({ title: 'Practise scales', when: 'After dinner', durationMinutes: 10 }, 'id-1', '2026-10-13T09:00:00.000Z');

describe('local task repository', () => {
  it('round-trips tasks through storage', async () => {
    const repo = createLocalTaskRepository({ storage: window.localStorage });
    expect(await repo.load()).toEqual([]);
    await repo.save([task]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ version: 1 });
    expect(await repo.load()).toEqual([task]);
  });

  it('drops malformed records instead of showing them', () => {
    const raw = JSON.stringify({ version: 1, tasks: [task, { id: 'x' }, { ...task, id: 'y', title: '   ' }, null] });
    expect(parsePayload(raw)).toEqual([task]);
  });

  it('reports unreadable data rather than silently discarding it', () => {
    expect(() => parsePayload('{not json')).toThrow(StorageReadError);
    expect(() => parsePayload(JSON.stringify({ version: 2, tasks: [] }))).toThrow(StorageReadError);
  });
});
