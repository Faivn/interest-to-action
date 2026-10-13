import { useId } from 'react';

interface SparkMarkProps {
  size?: number;
  className?: string;
}

/** The four-point ✦ spark — the product's only "AI / possibility" glyph (DESIGN.md §7). */
export function SparkMark({ size = 24, className }: SparkMarkProps) {
  // useId output contains characters that are awkward inside url(#…); keep it alphanumeric.
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B9A7F0" />
          <stop offset="0.55" stopColor="#FFB98A" />
          <stop offset="1" stopColor="#E2622B" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.5c.7 5.2 2.6 7.6 9.5 10.5-6.9 2.9-8.8 5.3-9.5 10.5-.7-5.2-2.6-7.6-9.5-10.5 6.9-2.9 8.8-5.3 9.5-10.5Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}
