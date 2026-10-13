import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import './Toast.css';

export interface ToastOptions {
  message: string;
  tone?: 'success' | 'neutral' | 'error';
  /** e.g. "Undo" */
  actionLabel?: string;
  onAction?: () => void;
}

interface ActiveToast extends ToastOptions {
  id: number;
}

interface ToastApi {
  show(options: ToastOptions): void;
  dismiss(): void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 5000;
const DURATION_WITH_ACTION_MS = 8000;

/** One toast at a time; a new toast replaces the current one (DESIGN.md §8.11). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(1);

  const dismiss = useCallback(() => setToast(null), []);
  const show = useCallback((options: ToastOptions) => {
    setPaused(false);
    setToast({ ...options, id: nextId.current++ });
  }, []);

  useEffect(() => {
    if (!toast || paused) return;
    const timer = window.setTimeout(dismiss, toast.actionLabel ? DURATION_WITH_ACTION_MS : DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, paused, dismiss]);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* The live region stays mounted so screen readers announce new content reliably. */}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            className={`toast toast--${toast.tone ?? 'neutral'}`}
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            {toast.tone === 'success' && <Check className="toast__icon" aria-hidden="true" size={20} strokeWidth={2.5} />}
            {toast.tone === 'error' && <TriangleAlert className="toast__icon" aria-hidden="true" size={20} />}
            <span className="toast__message">{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.onAction?.();
                  dismiss();
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
