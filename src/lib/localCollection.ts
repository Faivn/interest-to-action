/**
 * Persistence boundary for a list of records. Async so a server-backed
 * implementation can replace local storage without touching the UI.
 */
export interface CollectionRepository<T> {
  load(): Promise<T[]>;
  save(items: T[]): Promise<void>;
  /** Subscribe to changes made elsewhere (e.g. another tab). Returns an unsubscribe function. */
  subscribe?(onChange: (items: T[]) => void): () => void;
}

export class StorageReadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageReadError';
  }
}

interface StoredPayload {
  version: number;
  items: unknown[];
}

/**
 * Parses a stored payload. Unreadable data throws (so the UI can protect it);
 * individual malformed records are dropped rather than shown.
 */
export function parseCollection<T>(raw: string | null, version: number, parseItem: (value: unknown) => T | null): T[] {
  if (raw == null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new StorageReadError('Saved data could not be read.', { cause: error });
  }
  const payload = data as Partial<StoredPayload> | null;
  if (!payload || payload.version !== version || !Array.isArray(payload.items)) {
    throw new StorageReadError('Saved data is in an unrecognised format.');
  }
  return payload.items.map(parseItem).filter((item): item is T => item !== null);
}

export interface LocalCollectionOptions<T> {
  key: string;
  version: number;
  parseItem: (value: unknown) => T | null;
  storage?: Storage;
  /** Artificial latency for exercising loading states in development. */
  latencyMs?: number;
}

const wait = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

export function createLocalCollection<T>({
  key,
  version,
  parseItem,
  storage = window.localStorage,
  latencyMs = 0,
}: LocalCollectionOptions<T>): CollectionRepository<T> {
  return {
    async load() {
      await wait(latencyMs);
      return parseCollection(storage.getItem(key), version, parseItem);
    },
    async save(items) {
      const payload: StoredPayload = { version, items };
      storage.setItem(key, JSON.stringify(payload));
    },
    subscribe(onChange) {
      const handler = (event: StorageEvent) => {
        if (event.key !== key || event.storageArea !== storage) return;
        try {
          onChange(parseCollection(event.newValue, version, parseItem));
        } catch {
          // Ignore unreadable writes from other tabs; this tab keeps its state.
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}

/** Small validators shared by record parsers. */
export const is = {
  string: (v: unknown): v is string => typeof v === 'string',
  nonEmptyString: (v: unknown): v is string => typeof v === 'string' && v.trim() !== '',
  nullableString: (v: unknown): v is string | null => v === null || typeof v === 'string',
  positiveInt: (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0,
};
