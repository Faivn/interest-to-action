import type { Task, TaskDraft } from './types';

export type TasksAction =
  | { type: 'replaced'; tasks: Task[] }
  | { type: 'added'; task: Task }
  | { type: 'edited'; id: string; draft: TaskDraft; now: string }
  | { type: 'statusSet'; id: string; completed: boolean; now: string }
  | { type: 'removed'; id: string }
  | { type: 'restored'; task: Task; index: number };

export function normaliseDraft(draft: TaskDraft): Pick<Task, 'title' | 'when' | 'durationMinutes'> {
  const when = draft.when.trim();
  return {
    title: draft.title.trim(),
    when: when === '' ? null : when,
    durationMinutes: draft.durationMinutes,
  };
}

export function createTask(draft: TaskDraft, id: string, now: string): Task {
  return {
    id,
    ...normaliseDraft(draft),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

/** Tasks are stored newest first. */
export function tasksReducer(tasks: Task[], action: TasksAction): Task[] {
  switch (action.type) {
    case 'replaced':
      return action.tasks;
    case 'added':
      return [action.task, ...tasks];
    case 'edited':
      return tasks.map((t) =>
        t.id === action.id ? { ...t, ...normaliseDraft(action.draft), updatedAt: action.now } : t,
      );
    case 'statusSet':
      return tasks.map((t) =>
        t.id === action.id
          ? {
              ...t,
              status: action.completed ? 'completed' : 'active',
              completedAt: action.completed ? action.now : null,
              updatedAt: action.now,
            }
          : t,
      );
    case 'removed':
      return tasks.filter((t) => t.id !== action.id);
    case 'restored': {
      if (tasks.some((t) => t.id === action.task.id)) return tasks;
      const index = Math.min(Math.max(action.index, 0), tasks.length);
      return [...tasks.slice(0, index), action.task, ...tasks.slice(index)];
    }
  }
}

export function selectActive(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'active');
}

/** Most recently completed first. */
export function selectCompleted(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}
