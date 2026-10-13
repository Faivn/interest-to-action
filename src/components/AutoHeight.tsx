import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { m } from 'motion/react';
import { SPRING_LAYOUT } from '../lib/motion';

interface AutoHeightProps {
  children: ReactNode;
  className?: string;
  /** Collapse to 0 regardless of content (used by Collapsible). */
  collapsed?: boolean;
}

/**
 * Springs its height to whatever its content measures, so swapping content never jumps
 * (beUI Collapsible technique: ResizeObserver + animated height). Instant under reduced motion
 * via MotionConfig.
 */
export function AutoHeight({ children, className, collapsed = false }: AutoHeightProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <m.div
      className={className}
      style={{ overflow: 'hidden' }}
      initial={false}
      animate={{ height: collapsed ? 0 : height }}
      transition={SPRING_LAYOUT}
    >
      <div ref={innerRef}>{children}</div>
    </m.div>
  );
}
