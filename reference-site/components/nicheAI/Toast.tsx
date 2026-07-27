'use client';

/**
 * Lightweight, accessible toast/notification system for the Niche Finder.
 * Used for save success, email sent, errors and reminders.
 */

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  notify: (message: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      {/* Own theme attr so CSS vars resolve even though this renders outside .cx-root */}
      <div data-cx-theme="dark" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="cx-glass pointer-events-auto flex items-center gap-2 px-4 py-3 text-sm font-semibold cx-fade-up"
            style={{ color: 'var(--cx-text)', maxWidth: 440 }}
          >
            <span aria-hidden>{t.kind === 'success' ? '✅' : t.kind === 'error' ? '⚠️' : 'ℹ️'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  // Safe no-op if used outside a provider (keeps components decoupled).
  return ctx ?? { notify: () => undefined };
}
