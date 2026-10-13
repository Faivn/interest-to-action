import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createId } from '../../lib/id';
import type { TaskRepository } from './taskRepository';
import { createTask, tasksReducer, type TasksAction } from './tasksReducer';
import type { Task, TaskDraft } from './types';

export type LoadStatus = 'loading' | 'ready' | 'error';

export interface RemovedTask {
  task: Task;
  index: number;
}

export interface TasksController {
  status: LoadStatus;
  tasks: Task[];
  /** True when the latest change could not be written to storage. */
  saveFailed: boolean;
  reload(): void;
  retrySave(): void;
  add(draft: TaskDraft): Task;
  edit(id: string, draft: TaskDraft): void;
  setCompleted(id: string, completed: boolean): void;
  remove(id: string): RemovedTask | null;
  restore(removed: RemovedTask): void;
}

const now = () => new Date().toISOString();

export function useTasks(repository: TaskRepository): TasksController {
  const [tasks, dispatch] = useReducer(tasksReducer, []);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [saveFailed, setSaveFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);

  // Only user mutations are persisted; loads and cross-tab updates are not re-saved.
  const dirty = useRef(false);
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    repository.load().then(
      (loaded) => {
        if (cancelled) return;
        dirty.current = false;
        dispatch({ type: 'replaced', tasks: loaded });
        setStatus('ready');
      },
      () => {
        if (!cancelled) setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, loadAttempt]);

  useEffect(() => {
    if (status !== 'ready' || !repository.subscribe) return;
    return repository.subscribe((next) => {
      dirty.current = false;
      dispatch({ type: 'replaced', tasks: next });
    });
  }, [repository, status]);

  useEffect(() => {
    if (!dirty.current) return;
    let cancelled = false;
    repository.save(tasks).then(
      () => {
        if (cancelled) return;
        dirty.current = false;
        setSaveFailed(false);
      },
      () => {
        if (!cancelled) setSaveFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, tasks, saveAttempt]);

  const mutate = useCallback((action: TasksAction) => {
    dirty.current = true;
    dispatch(action);
  }, []);

  const add = useCallback(
    (draft: TaskDraft) => {
      const task = createTask(draft, createId(), now());
      mutate({ type: 'added', task });
      return task;
    },
    [mutate],
  );

  const edit = useCallback(
    (id: string, draft: TaskDraft) => mutate({ type: 'edited', id, draft, now: now() }),
    [mutate],
  );

  const setCompleted = useCallback(
    (id: string, completed: boolean) => mutate({ type: 'statusSet', id, completed, now: now() }),
    [mutate],
  );

  const remove = useCallback(
    (id: string): RemovedTask | null => {
      const index = tasksRef.current.findIndex((t) => t.id === id);
      if (index === -1) return null;
      const removed = { task: tasksRef.current[index], index };
      mutate({ type: 'removed', id });
      return removed;
    },
    [mutate],
  );

  const restore = useCallback(
    ({ task, index }: RemovedTask) => mutate({ type: 'restored', task, index }),
    [mutate],
  );

  const reload = useCallback(() => setLoadAttempt((n) => n + 1), []);
  const retrySave = useCallback(() => {
    dirty.current = true;
    setSaveAttempt((n) => n + 1);
  }, []);

  return { status, tasks, saveFailed, reload, retrySave, add, edit, setCompleted, remove, restore };
}
