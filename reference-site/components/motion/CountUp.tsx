'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts a stat up when it scrolls into view.
 *
 * Takes the already-authored display string ("10,000+", "4.9/5", "₹2 Cr") and
 * animates only the numeric run inside it, preserving the prefix, suffix,
 * decimal places and grouping exactly as written. That way the stat copy stays
 * in `lib/site.ts` as human-readable text and no caller has to decompose a
 * number into value/prefix/suffix props.
 */

const NUMERIC = /^(\D*?)([\d,]+(?:\.\d+)?)(.*)$/s;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({ value, className = '', duration = 1400 }: { value: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [text, setText] = useState(value);
  const parsed = value.match(NUMERIC);

  useEffect(() => {
    const el = ref.current;
    // Nothing numeric to animate ("Live", "Weekly") — render as authored.
    if (!el || !parsed) return;

    const [, prefix, rawNumber, suffix] = parsed;
    const grouped = rawNumber.includes(',');
    const decimals = rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0;
    const target = Number(rawNumber.replace(/,/g, ''));
    if (!Number.isFinite(target)) return;

    const format = (n: number) => {
      const body = grouped
        ? // en-IN so a 5-figure stat groups as 10,000 like the rest of the site
          n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : n.toFixed(decimals);
      return `${prefix}${body}${suffix}`;
    };

    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setText(format(target));
      return;
    }

    // Start from zero so the first paint doesn't show the final figure.
    setText(format(0));

    let frame = 0;
    let start = 0;
    const run = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      setText(format(target * easeOutCubic(t)));
      if (t < 1) frame = requestAnimationFrame(run);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          frame = requestAnimationFrame(run);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration, parsed]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
