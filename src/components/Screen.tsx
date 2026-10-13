import { useEffect, useRef, type ReactNode } from 'react';
import './Screen.css';

interface ScreenProps {
  /** Top bar content (leading button, step indicator…). */
  topBar?: ReactNode;
  children: ReactNode;
  /** Primary/secondary actions pinned in thumb reach on phones, inline from 600px. */
  actions?: ReactNode;
  /** Daybreak gradient wash — reserved for AI moments (DESIGN.md §4). */
  wash?: boolean;
  className?: string;
  /** Moves focus to the first heading on mount, so screen-reader users land on the new screen. */
  focusHeading?: boolean;
}

export function Screen({ topBar, children, actions, wash = false, className, focusHeading = true }: ScreenProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (!focusHeading) return;
    const heading = bodyRef.current?.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [focusHeading]);

  return (
    <div className={['screen', wash && 'screen--wash', actions && 'screen--with-actions', className].filter(Boolean).join(' ')}>
      {/* Full-bleed on phones; a centred surface panel on paper from 1024px (DESIGN.md §12). */}
      <div className="screen__frame">
        {topBar !== undefined && <div className="screen__top-bar">{topBar}</div>}
        <div ref={bodyRef} className="screen__body">
          {children}
        </div>
        {actions && <div className="screen__actions">{actions}</div>}
      </div>
    </div>
  );
}

interface TopBarProps {
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
}

export function TopBar({ leading, center, trailing }: TopBarProps) {
  return (
    <div className="top-bar">
      <div className="top-bar__leading">{leading}</div>
      <div className="top-bar__center">{center}</div>
      <div className="top-bar__trailing">{trailing}</div>
    </div>
  );
}
