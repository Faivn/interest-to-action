import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import './Sheet.css';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Pinned action area (buttons) at the bottom of the sheet. */
  footer?: ReactNode;
  /** Element to focus when the sheet opens; defaults to the dialog's first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Bottom sheet on phones, centred dialog from 600px (DESIGN.md §8.14, §12).
 * Built on the native <dialog> element for focus trapping, Esc and inert background.
 */
export function Sheet({ open, onClose, title, description, children, footer, initialFocusRef }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement;
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      if (returnFocus.current instanceof HTMLElement && returnFocus.current.isConnected) {
        returnFocus.current.focus();
      }
    }
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop targets the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="sheet__panel">
          <div className="sheet__grabber" aria-hidden="true" />
          <header className="sheet__header">
            <div>
              <h2 id={titleId} className="t-title-2">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="t-callout sheet__description">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Close" icon={<X />} onClick={onClose} />
          </header>
          <div className="sheet__body">{children}</div>
          {footer && <footer className="sheet__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
