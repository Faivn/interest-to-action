import type { Task } from './types';

/**
 * Persistence boundary for tasks. Async so a server-backed implementation can
 * replace local storage without touching the UI.
 */
export interface TaskRepository {
  load(): Promise<Task[]>;
  save(tasks: Task[]): Promise<void>;
  /** Subscribe to changes made elsewhere (e.g. another tab). Returns an unsubscribe function. */
  subscribe?(onChange: (tasks: Task[]) => void): () => void;
}

export class StorageReadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageReadError';
  }
}

export const STORAGE_KEY = 'ita.tasks.v1';

interface StoredPayload {
  version: 1;
  tasks: unknown[];
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

/** Validates one stored record; anything malformed is dropped rather than shown. */
export function parseTask(value: unknown): Task | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!isString(v.id) || !isString(v.title) || v.title.trim() === '') return null;
  if (v.status !== 'active' && v.status !== 'completed') return null;
  if (!isString(v.createdAt) || !isString(v.updatedAt)) return null;
  if (!isNullableString(v.when ?? null) || !isNullableString(v.completedAt ?? null)) return null;
  const duration = v.durationMinutes ?? null;
  if (duration !== null && (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0)) {
    return null;
  }
  return {
    id: v.id,
    title: v.title,
    when: (v.when as string | null | undefined) ?? null,
    durationMinutes: duration as number | null,
    status: v.status,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    completedAt: (v.completedAt as string | null | undefined) ?? null,
  };
}

export function parsePayload(raw: string | null): Task[] {
  if (raw == null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new StorageReadError('Saved tasks could not be read.', { cause: error });
  }
  const payload = data as Partial<StoredPayload> | null;
  if (!payload || payload.version !== 1 || !Array.isArray(payload.tasks)) {
    throw new StorageReadError('Saved tasks are in an unrecognised format.');
  }
  return payload.tasks.map(parseTask).filter((t): t is Task => t !== null);
}

interface LocalRepositoryOptions {
  storage?: Storage;
  key?: string;
  /** Artificial latency for exercising loading states in development. */
  latencyMs?: number;
}

const wait = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

export function createLocalTaskRepository({
  storage = window.localStorage,
  key = STORAGE_KEY,
  latencyMs = 0,
}: LocalRepositoryOptions = {}): TaskRepository {
  return {
    async load() {
      await wait(latencyMs);
      return parsePayload(storage.getItem(key));
    },
    async save(tasks) {
      const payload: StoredPayload = { version: 1, tasks };
      storage.setItem(key, JSON.stringify(payload));
    },
    subscribe(onChange) {
      const handler = (event: StorageEvent) => {
        if (event.key !== key || event.storageArea !== storage) return;
        try {
          onChange(parsePayload(event.newValue));
        } catch {
          // Ignore unreadable writes from other tabs; this tab keeps its state.
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
