import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m, type PanInfo } from 'motion/react';
import { Check, TriangleAlert } from 'lucide-react';
import { prefersReducedMotion, SPRING_PANEL } from '../lib/motion';
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
  show(options: ToastOptions): number;
  dismiss(id?: number): void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DURATION_MS = 5000;
const DURATION_WITH_ACTION_MS = 8000;
/** Older toasts beyond this are let go, newest kept (beUI Animated Toast Stack). */
const MAX_VISIBLE = 3;
/** Swipe distance or speed that dismisses a toast. */
const SWIPE_DISTANCE = 72;
const SWIPE_VELOCITY = 520;

/** Stacked toasts with swipe-to-dismiss and Undo (DESIGN.md §8.11). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const [paused, setPaused] = useState(false);
  const nextId = useRef(1);

  const dismiss = useCallback((id?: number) => {
    setToasts((list) => (id === undefined ? list.slice(0, -1) : list.filter((t) => t.id !== id)));
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToasts((list) => [...list, { ...options, id }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* The live region stays mounted so screen readers announce new content reliably. */}
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <ol className="toast-stack">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} paused={paused} onDismiss={() => dismiss(toast.id)} />
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, paused, onDismiss }: { toast: ActiveToast; paused: boolean; onDismiss: () => void }) {
  // Each toast keeps its own clock, paused while the stack is hovered or focused.
  const remaining = useRef(toast.actionLabel ? DURATION_WITH_ACTION_MS : DURATION_MS);
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, onDismiss]);

  const [canSwipe] = useState(() => !prefersReducedMotion());
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY) onDismiss();
  };

  return (
    <m.li
      layout
      className={`toast toast--${toast.tone ?? 'neutral'}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.16 } }}
      transition={SPRING_PANEL}
      drag={canSwipe ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragEnd={onDragEnd}
    >
      {toast.tone === 'success' && <Check className="toast__icon" aria-hidden="true" size={20} />}
      {toast.tone === 'error' && <TriangleAlert className="toast__icon" aria-hidden="true" size={20} />}
      <span className="toast__message">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            toast.onAction?.();
            onDismiss();
          }}
        >
          {toast.actionLabel}
        </button>
      )}
    </m.li>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}
