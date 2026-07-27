'use client';

/**
 * Virtualized niche grid.
 *
 * Row offsets are pure arithmetic (fixed card height × measured column count),
 * so only the visible window ± overscan is ever mounted. That is what keeps a
 * 10,000-result list at a few dozen DOM nodes instead of ten thousand.
 *
 * The scroll container is the window, not an inner div: a nested scroller
 * inside a page that also scrolls is the single most common way long lists feel
 * broken on mobile.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { NicheCard, NICHE_CARD_HEIGHT } from './NicheCard';
import type { EnrichedTopic } from '@/lib/nicheAI/topicEngine';

const GAP = 10;
const ROW = NICHE_CARD_HEIGHT + GAP;
const OVERSCAN = 2;

function useColumns(ref: React.RefObject<HTMLDivElement | null>): number {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setCols(w >= 1024 ? 4 : w >= 760 ? 3 : w >= 520 ? 2 : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return cols;
}

export function NicheGrid({
  topics,
  selected,
  favourites,
  query = '',
  matchScores,
  onToggle,
  onDetails,
  onFavourite,
}: {
  topics: EnrichedTopic[];
  selected: Set<string>;
  favourites?: Set<string>;
  query?: string;
  matchScores?: Map<string, number>;
  onToggle: (id: string) => void;
  onDetails: (t: EnrichedTopic) => void;
  onFavourite?: (id: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cols = useColumns(hostRef);
  const [range, setRange] = useState({ start: 0, end: 12 });

  const rowCount = Math.ceil(topics.length / cols);
  const totalHeight = rowCount * ROW;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      // Offset of the viewport top within the grid.
      const top = Math.max(0, -rect.top);
      const firstRow = Math.max(0, Math.floor(top / ROW) - OVERSCAN);
      const visibleRows = Math.ceil(window.innerHeight / ROW) + OVERSCAN * 2;
      setRange({ start: firstRow * cols, end: Math.min(topics.length, (firstRow + visibleRows) * cols) });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [cols, topics.length]);

  const window_ = useMemo(() => topics.slice(range.start, range.end), [topics, range.start, range.end]);
  const padTop = Math.floor(range.start / cols) * ROW;

  return (
    <div ref={hostRef} data-testid="nf-niche-grid" aria-label={`${topics.length} niches`}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: padTop,
            left: 0,
            right: 0,
            display: 'grid',
            gap: GAP,
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {window_.map((t) => (
            <NicheCard
              key={t.id}
              topic={t}
              selected={selected.has(t.id)}
              favourite={favourites?.has(t.id)}
              query={query}
              matchScore={matchScores?.get(t.id)}
              onToggle={onToggle}
              onDetails={onDetails}
              onFavourite={onFavourite}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
