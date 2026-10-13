import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { createId } from '../../lib/id';
import type { PlanRepository } from './planRepository';
import { createPlan, plansReducer, type NewPlanInput, type PlansAction } from './plansReducer';
import type { PlanDraft, PlanStatus, SavedPlan } from './types';

export type LoadStatus = 'loading' | 'ready' | 'error';

export interface RemovedPlan {
  plan: SavedPlan;
  index: number;
}

export interface PlansController {
  status: LoadStatus;
  plans: SavedPlan[];
  /** True when the latest change could not be written to storage. */
  saveFailed: boolean;
  reload(): void;
  retrySave(): void;
  /** Adds a plan and resolves once it has been written, so callers can confirm the save honestly. */
  add(input: NewPlanInput): Promise<SavedPlan>;
  edit(id: string, draft: PlanDraft): void;
  setStatus(id: string, status: PlanStatus): void;
  remove(id: string): RemovedPlan | null;
  restore(removed: RemovedPlan): void;
}

const now = () => new Date().toISOString();

export function usePlansStore(repository: PlanRepository): PlansController {
  const [plans, dispatch] = useReducer(plansReducer, []);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [saveFailed, setSaveFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);

  // Only user mutations are persisted; loads and cross-tab updates are not re-saved.
  const dirty = useRef(false);
  const plansRef = useRef(plans);
  useEffect(() => {
    plansRef.current = plans;
  }, [plans]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    repository.load().then(
      (loaded) => {
        if (cancelled) return;
        dirty.current = false;
        dispatch({ type: 'replaced', plans: loaded });
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
      dispatch({ type: 'replaced', plans: next });
    });
  }, [repository, status]);

  useEffect(() => {
    if (!dirty.current) return;
    let cancelled = false;
    repository.save(plans).then(
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
  }, [repository, plans, saveAttempt]);

  const mutate = useCallback((action: PlansAction) => {
    dirty.current = true;
    dispatch(action);
  }, []);

  const add = useCallback(
    async (input: NewPlanInput) => {
      if (status !== 'ready') throw new Error('Saved plans are not available right now.');
      const plan = createPlan(input, createId(), now());
      // Write first so "Plan saved" is only ever shown for a plan that really was saved.
      await repository.save([plan, ...plansRef.current]);
      dispatch({ type: 'added', plan });
      return plan;
    },
    [repository, status],
  );

  const edit = useCallback(
    (id: string, draft: PlanDraft) => mutate({ type: 'edited', id, draft, now: now() }),
    [mutate],
  );

  const setPlanStatus = useCallback(
    (id: string, next: PlanStatus) => mutate({ type: 'statusSet', id, status: next, now: now() }),
    [mutate],
  );

  const remove = useCallback(
    (id: string): RemovedPlan | null => {
      const index = plansRef.current.findIndex((p) => p.id === id);
      if (index === -1) return null;
      const removed = { plan: plansRef.current[index], index };
      mutate({ type: 'removed', id });
      return removed;
    },
    [mutate],
  );

  const restore = useCallback(
    ({ plan, index }: RemovedPlan) => mutate({ type: 'restored', plan, index }),
    [mutate],
  );

  const reload = useCallback(() => setLoadAttempt((n) => n + 1), []);
  const retrySave = useCallback(() => {
    dirty.current = true;
    setSaveAttempt((n) => n + 1);
  }, []);

  return useMemo(
    () => ({ status, plans, saveFailed, reload, retrySave, add, edit, setStatus: setPlanStatus, remove, restore }),
    [status, plans, saveFailed, reload, retrySave, add, edit, setPlanStatus, remove, restore],
  );
}

const PlansContext = createContext<PlansController | null>(null);

export function PlansProvider({ repository, children }: { repository: PlanRepository; children: ReactNode }) {
  const controller = usePlansStore(repository);
  return createElement(PlansContext.Provider, { value: controller }, children);
}

export function usePlans(): PlansController {
  const context = useContext(PlansContext);
  if (!context) throw new Error('usePlans must be used inside <PlansProvider>.');
  return context;
}
