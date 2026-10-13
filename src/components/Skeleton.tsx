import type { CSSProperties } from 'react';
import './Skeleton.css';

interface SkeletonBarProps {
  width?: CSSProperties['width'];
  height?: number;
  radius?: CSSProperties['borderRadius'];
  delayMs?: number;
}

/** Shimmering placeholder bar; static under reduced motion (DESIGN.md §10.1). */
export function SkeletonBar({ width = '100%', height = 12, radius = 'var(--radius-xs)', delayMs = 0 }: SkeletonBarProps) {
  return (
    <span
      className="skeleton-bar"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, animationDelay: `${delayMs}ms` }}
    />
  );
}
