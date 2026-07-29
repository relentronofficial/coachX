'use client';

import { useCallback, useRef, type ReactNode } from 'react';

/**
 * Cursor-aware tilt. Writes `--tilt-x` / `--tilt-y` on pointer move; the
 * `.fx-tilt` rule in globals.css turns them into a perspective rotation.
 *
 * Values are written straight to `element.style` rather than through React
 * state — a pointermove setState would re-render the subtree on every frame.
 * Touch never fires pointermove without a drag, so coarse pointers simply get
 * the untilted card.
 */
export function TiltCard({
  children,
  className = '',
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees at the card's corners. */
  max?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      // -0.5..0.5 from the centre, so the sign flips either side of the axis.
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--tilt-x', String(px * max * 2));
      el.style.setProperty('--tilt-y', String(-py * max * 2));
    },
    [max],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0');
    el.style.setProperty('--tilt-y', '0');
  }, []);

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`fx-tilt ${className}`.trim()}>
      {children}
    </div>
  );
}
