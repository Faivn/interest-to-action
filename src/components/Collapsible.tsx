import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { m } from 'motion/react';
import { AutoHeight } from './AutoHeight';

interface CollapsibleProps {
  id: string;
  open: boolean;
  children: ReactNode;
  /** Focus returns here if it was inside the content when it closes. */
  triggerRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * Spring height reveal with a quick fade (beUI Animated Collapsible). Closed content is
 * aria-hidden and inert, so it leaves the accessibility tree and the tab order.
 */
export function Collapsible({ id, open, children, triggerRef, className }: CollapsibleProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) return;
    if (contentRef.current?.contains(document.activeElement)) triggerRef?.current?.focus();
  }, [open, triggerRef]);

  return (
    <AutoHeight collapsed={!open} className={className}>
      <m.div
        ref={contentRef}
        id={id}
        role="region"
        aria-hidden={!open || undefined}
        inert={!open}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: open ? 0.18 : 0.12 }}
      >
        {children}
      </m.div>
    </AutoHeight>
  );
}
