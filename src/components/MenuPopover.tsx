import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { SPRING_PANEL } from '../lib/motion';
import './MenuPopover.css';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  tone?: 'neutral' | 'danger';
  onSelect: () => void;
}

interface MenuPopoverProps {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  label: string;
  /** The button that opened the menu; focus returns here. */
  anchorRef: RefObject<HTMLElement | null>;
}

/**
 * A small menu that unfolds from its trigger (beUI Popover, morph variant).
 * Arrow keys move between items, Esc and outside clicks close, and focus returns to the trigger.
 */
export function MenuPopover({ open, onClose, items, label, anchorRef }: MenuPopoverProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !anchorRef.current?.contains(target)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onClose, anchorRef]);

  const close = () => {
    onClose();
    anchorRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const entries = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const index = entries.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      entries[(index + delta + entries.length) % entries.length]?.focus();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={menuRef}
          role="menu"
          aria-label={label}
          className="menu-popover"
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)', transition: { duration: 0.12 } }}
          transition={SPRING_PANEL}
          onKeyDown={onKeyDown}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`menu-popover__item menu-popover__item--${item.tone ?? 'neutral'}`}
              onClick={() => {
                onClose();
                item.onSelect();
              }}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </m.div>
      )}
    </AnimatePresence>
  );
}
