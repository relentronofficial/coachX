'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Scroll-reveal primitives for the SURFACE & SCROLL MOTION LAYER in
 * globals.css. The CSS owns the easing and the offsets; this file only decides
 * *when* an element has entered the viewport and flips `data-shown`.
 *
 * Deliberately not a library. The whole behaviour is one IntersectionObserver
 * and a data attribute, which keeps it a ~1 KB client component instead of the
 * ~40 KB an animation runtime would add to every marketing page.
 */

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'rise';

const DIRECTION_CLASS: Record<RevealDirection, string> = {
  up: 'fx-up',
  down: 'fx-down',
  left: 'fx-left',
  right: 'fx-right',
  zoom: 'fx-zoom',
  rise: 'fx-rise',
};

interface RevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  /** Milliseconds added before this element animates — used to cascade a row. */
  delay?: number;
  /** Fraction of the element that must be visible before it fires. */
  amount?: number;
  /** Re-animate every time it re-enters. Off by default: replaying on scroll-up reads as jitter. */
  repeat?: boolean;
  className?: string;
}

export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  amount = 0.15,
  repeat = false,
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (old browser, some in-app webviews): show it and
    // stop. Content visibility must never depend on an optional API.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    // Already past the fold on load (deep link, refresh mid-page) — the
    // observer would fire anyway, but this avoids a frame of hidden content.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      setShown(true);
      if (!repeat) return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (!repeat) io.unobserve(entry.target);
          } else if (repeat) {
            setShown(false);
          }
        }
      },
      { threshold: amount, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [amount, repeat]);

  return (
    <div
      ref={ref}
      data-shown={shown}
      className={`fx-reveal ${DIRECTION_CLASS[direction]} ${className}`.trim()}
      style={delay ? ({ '--fx-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

interface StaggerProps {
  children: ReactNode;
  /** Gap between consecutive children, in ms. */
  step?: number;
  direction?: RevealDirection;
  /** Classes for the container — this is where the grid/flex layout goes. */
  className?: string;
  /** Classes for each wrapper. `h-full` here keeps equal-height cards equal. */
  itemClassName?: string;
  /** Delay applied to the first child. */
  initialDelay?: number;
  /** Cap the cascade so a long list's tail doesn't wait seconds to appear. */
  maxDelay?: number;
  /** Forwarded as `data-testid` — Stagger often replaces a grid that had one. */
  testId?: string;
}

/**
 * Wraps each child in its own <Reveal> with an increasing delay, so a grid
 * cascades in instead of snapping in as one block. The wrapper becomes the
 * grid item, which is why `itemClassName` exists — equal-height card rows need
 * `h-full` on the wrapper as well as the card.
 */
export function Stagger({
  children,
  step = 70,
  direction = 'up',
  className = '',
  itemClassName = '',
  initialDelay = 0,
  maxDelay = 480,
  testId,
}: StaggerProps) {
  return (
    <div className={className} data-testid={testId}>
      {Children.map(children, (child, i) => (
        <Reveal
          direction={direction}
          delay={Math.min(initialDelay + i * step, maxDelay)}
          className={itemClassName}
        >
          {child}
        </Reveal>
      ))}
    </div>
  );
}
