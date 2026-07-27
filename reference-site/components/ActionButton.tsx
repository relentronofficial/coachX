'use client';

/**
 * Interactive button with the pointer-driven parts of the motion system.
 *
 * CSS covers hover, press and the per-identity personalities. Three things it
 * cannot do without JS live here:
 *
 *  - **Ripple** — needs the click coordinates to originate from the pointer.
 *  - **Magnetic hover** (`fx="book"`) — writes `--mx`/`--my` so the button
 *    leans toward the cursor.
 *  - **Async lifecycle** — spinner, disabled-while-pending, and a guard that
 *    makes a second click during flight a no-op rather than a duplicate submit.
 *
 * All three respect `prefers-reduced-motion`: the ripple is not created and the
 * magnet is not engaged, so no work happens at all rather than being animated
 * and then hidden.
 */

import { useCallback, useRef, useState } from 'react';
import { buttonClass, resolveFx, rippleClass, type ButtonFx, type ButtonVariant } from '@/lib/ui/buttonFx';

const MAGNET_STRENGTH = 0.18;
const MAGNET_MAX = 6; // px — a lean, not a jump

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export interface ActionButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  fx?: ButtonFx;
  /** Leading/trailing icon. Gets `.btn-ico` so each identity can animate it. */
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  /** Sync or async. While a returned promise is pending the button is busy. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
  /** Force the busy state from outside (e.g. a parent-owned submit). */
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
  /** Extra state hook for the success / danger / step identities. */
  dataState?: string;
}

export function ActionButton({
  children,
  variant = 'primary',
  fx,
  icon,
  iconPosition = 'end',
  onClick,
  loading,
  disabled,
  type = 'button',
  className = '',
  dataState,
  ...rest
}: ActionButtonProps) {
  const [pending, setPending] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const inFlight = useRef(false);
  const rippleId = useRef(0);

  const resolved = resolveFx(variant, fx);
  const busy = loading || pending;
  const inert = busy || disabled;

  const magnetic = resolved === 'book';

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!magnetic || inert || prefersReducedMotion()) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * MAGNET_STRENGTH;
      const dy = (e.clientY - (r.top + r.height / 2)) * MAGNET_STRENGTH;
      el.style.setProperty('--mx', String(Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dx))));
      el.style.setProperty('--my', String(Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dy))));
    },
    [magnetic, inert],
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.style.removeProperty('--mx');
    e.currentTarget.style.removeProperty('--my');
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (inert || inFlight.current) return; // guards double submits

      if (!prefersReducedMotion()) {
        const r = e.currentTarget.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const id = ++rippleId.current;
        setRipples((list) => [...list, { id, x: e.clientX - r.left - size / 2, y: e.clientY - r.top - size / 2, size }]);
        window.setTimeout(() => setRipples((list) => list.filter((x) => x.id !== id)), 600);
      }

      const result = onClick?.(e);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        inFlight.current = true;
        setPending(true);
        try {
          await result;
        } finally {
          inFlight.current = false;
          setPending(false);
        }
      }
    },
    [inert, onClick],
  );

  const iconNode = icon ? (
    <span className="btn-ico" aria-hidden="true">
      {icon}
    </span>
  ) : null;

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      data-loading={busy ? 'true' : undefined}
      data-state={dataState}
      onClick={handleClick}
      onPointerMove={magnetic ? onPointerMove : undefined}
      onPointerLeave={magnetic ? onPointerLeave : undefined}
      className={buttonClass(variant, fx, className)}
    >
      {busy ? <span className="btn-spinner" aria-hidden="true" /> : iconPosition === 'start' ? iconNode : null}
      <span className="btn-label">{children}</span>
      {!busy && iconPosition === 'end' ? iconNode : null}
      {ripples.map((r) => (
        <span
          key={r.id}
          className={rippleClass(variant)}
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </button>
  );
}
