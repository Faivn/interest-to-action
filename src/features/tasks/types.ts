export type TaskStatus = 'active' | 'completed';

/**
 * A single next step the user intends to take.
 *
 * The shape deliberately mirrors an AI action plan (docs/ai-approach.md §2):
 * `when` is the trigger, `title` the action and `durationMinutes` the duration,
 * so saved plans can later be stored as tasks linked to an interest.
 */
export interface Task {
  id: string;
  title: string;
  when: string | null;
  durationMinutes: number | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/** The user-editable fields of a task. */
export interface TaskDraft {
  title: string;
  when: string;
  durationMinutes: number | null;
}

export const EMPTY_DRAFT: TaskDraft = { title: '', when: '', durationMinutes: null };

export interface DurationOption {
  value: number | null;
  label: string;
}

/** Matches the time chips in docs/design.md §4.3. */
export const DURATION_OPTIONS: readonly DurationOption[] = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30+ min' },
  { value: null, label: 'Not sure' },
];

export function formatDuration(minutes: number | null): string | null {
  if (minutes == null) return null;
  return DURATION_OPTIONS.find((o) => o.value === minutes)?.label ?? `${minutes} min`;
}

export function draftFromTask(task: Task): TaskDraft {
  return { title: task.title, when: task.when ?? '', durationMinutes: task.durationMinutes };
}
