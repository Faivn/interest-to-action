import './StepIndicator.css';

interface StepIndicatorProps {
  current: number;
  total: number;
}

/** Segmented progress for the planning flow; announced as text, not as segments (DESIGN.md §8.5). */
export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className="steps">
      <span className="visually-hidden">
        Step {current} of {total}
      </span>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden="true" className={`steps__segment${i < current ? ' steps__segment--done' : ''}`} />
      ))}
    </div>
  );
}
