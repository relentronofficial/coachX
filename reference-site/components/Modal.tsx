'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Reusable accessible modal dialog. Backdrop, ESC to close, focus moved into
 * the dialog, scroll locked while open. (Not a browser alert().)
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  dismissable = true,
  labelledById = 'modal-title',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  dismissable?: boolean;
  labelledById?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledById}
    >
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={() => dismissable && onClose()}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl2 bg-white p-6 shadow-glow-lg outline-none sm:p-8"
      >
        {title ? (
          <h2 id={labelledById} className="text-xl font-extrabold text-ink">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
