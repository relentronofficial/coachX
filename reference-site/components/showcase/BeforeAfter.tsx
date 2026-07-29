'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';

/**
 * Draggable before/after comparison.
 *
 * Deliberately compares *states of a business*, not screenshots. The only
 * before/after-looking assets on hand are the members' revenue screenshots,
 * and pairing two of those would manufacture a claim about someone's earnings
 * that nobody made — see the `revenueProof` note in CLAUDE.md. Qualitative
 * panels give the same interaction with nothing invented.
 *
 * The right panel is clipped by `clip-path` (compositor-friendly) rather than
 * resized, so dragging never triggers layout on the text inside it.
 */

export interface ComparePanel {
  label: string;
  title: string;
  points: string[];
}

export function BeforeAfter({
  before,
  after,
  className = '',
}: {
  before: ComparePanel;
  after: ComparePanel;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement | null>(null);
  const [split, setSplit] = useState(52);

  const setFromClientX = useCallback((clientX: number) => {
    const el = frame.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = ((clientX - r.left) / r.width) * 100;
    // Never let a panel close completely — a 0%/100% split reads as broken.
    setSplit(Math.max(8, Math.min(92, pct)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setFromClientX(e.clientX);
    },
    [setFromClientX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      setFromClientX(e.clientX);
    },
    [setFromClientX],
  );

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 12 : 4;
    if (e.key === 'ArrowLeft') setSplit((s) => Math.max(8, s - step));
    else if (e.key === 'ArrowRight') setSplit((s) => Math.min(92, s + step));
    else if (e.key === 'Home') setSplit(8);
    else if (e.key === 'End') setSplit(92);
    else return;
    e.preventDefault();
  }, []);

  return (
    <div
      ref={frame}
      className={`fx-compare relative select-none overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-soft ${className}`.trim()}
      style={{ ['--split' as string]: `${split}%` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {/* Left / "before" panel sits in normal flow and defines the height. */}
      <Panel panel={before} tone="before" />

      {/* Right / "after" panel overlays it, clipped to the split. */}
      <div className="fx-compare-clip absolute inset-0">
        <Panel panel={after} tone="after" />
      </div>

      {/* Handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Compare ${before.label} with ${after.label}`}
        aria-valuemin={8}
        aria-valuemax={92}
        aria-valuenow={Math.round(split)}
        aria-valuetext={`${Math.round(split)}% ${after.label}`}
        onKeyDown={onKeyDown}
        className="fx-compare-handle absolute inset-y-0 z-10 -ml-5 w-10 cursor-ew-resize touch-none focus:outline-none"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/70" />
        <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border border-white/70 bg-white text-ink shadow-soft transition-transform duration-200 hover:scale-110">
          <span aria-hidden="true" className="text-sm font-bold tracking-tighter">
            ⟨⟩
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The "after" panel is clipped from the left, so it must read on the left of
 * the frame; the "before" panel is what remains visible on the right and is
 * mirrored to sit there. Without this the uncovered half of a text comparison
 * is just empty space — the copy of both panels would be stacked under each
 * other on the left.
 */
function Panel({ panel, tone }: { panel: ComparePanel; tone: 'before' | 'after' }) {
  const isAfter = tone === 'after';
  return (
    <div
      className={`flex h-full min-h-[340px] flex-col p-7 sm:min-h-[360px] sm:p-9 ${
        isAfter ? 'surface-ink items-start text-left text-white' : 'items-end bg-slate-50 text-right text-ink'
      }`}
    >
      <span
        className={`inline-flex rounded-pill px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
          isAfter ? 'bg-amber/25 text-amber' : 'bg-slate-200 text-slate-500'
        }`}
      >
        {panel.label}
      </span>
      <p className={`mt-4 max-w-sm text-2xl font-extrabold leading-tight ${isAfter ? 'text-white' : 'text-ink'}`}>
        {panel.title}
      </p>
      <ul className="mt-5 space-y-2.5">
        {panel.points.map((p) => (
          <li
            key={p}
            className={`flex items-start gap-2.5 text-sm ${isAfter ? 'text-slate-200' : 'flex-row-reverse text-slate-500'}`}
          >
            <span aria-hidden="true" className={isAfter ? 'mt-0.5 text-amber' : 'mt-0.5 text-slate-400'}>
              {isAfter ? '✓' : '✕'}
            </span>
            <span className="max-w-xs">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Wrapper that adds the standard hint line under the comparison. */
export function CompareHint({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-center text-xs font-medium text-slate-400">
      <span aria-hidden="true">↔ </span>
      {children}
    </p>
  );
}
