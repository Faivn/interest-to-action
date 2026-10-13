const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * "Today", "Yesterday", weekday names up to 6 days ago, then "12 Oct" (DESIGN.md §8.10).
 * Never expresses lateness — dates are context, not pressure.
 */
export function formatRelativeDay(iso: string, now: Date = new Date(), locale?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return date.toLocaleDateString(locale, { weekday: 'long' });
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
