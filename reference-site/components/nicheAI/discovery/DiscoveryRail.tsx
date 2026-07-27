'use client';

/**
 * Horizontal recommendation rail — "Trending", "High income", "Beginner
 * friendly" and friends.
 *
 * A rail is the answer to "I don't know where to start": it puts a handful of
 * good, reasoned choices in front of the user before they ever touch search or
 * the category tree. Swipe-scrollable with snap points on touch, arrow-key
 * navigable on desktop.
 */

import { NicheCard } from './NicheCard';
import type { Rail } from '@/lib/nicheAI/discovery';
import type { EnrichedTopic } from '@/lib/nicheAI/topicEngine';

export function DiscoveryRail({
  rail,
  topics,
  selected,
  favourites,
  matchScores,
  onToggle,
  onDetails,
  onFavourite,
  onSeeAll,
}: {
  rail: Rail;
  topics: EnrichedTopic[];
  selected: Set<string>;
  favourites?: Set<string>;
  matchScores?: Map<string, number>;
  onToggle: (id: string) => void;
  onDetails: (t: EnrichedTopic) => void;
  onFavourite?: (id: string) => void;
  onSeeAll?: () => void;
}) {
  if (!topics.length) return null;

  return (
    <section className="mt-6" aria-labelledby={`rail-${rail.id}`} data-testid="nf-rail" data-rail={rail.id}>
      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 id={`rail-${rail.id}`} className="text-sm font-extrabold" style={{ color: 'var(--cx-text)' }}>
          <span aria-hidden="true" className="mr-1.5">
            {rail.icon}
          </span>
          {rail.title}
        </h3>
        <p className="cx-muted text-[11px]">{rail.blurb}</p>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="cx-focus ml-auto text-[11px] font-bold"
            style={{ color: 'var(--cx-gold)' }}
          >
            See all →
          </button>
        ) : null}
      </div>

      {/* Negative margin lets cards bleed to the screen edge on mobile while the
          page keeps its padding — the standard "peek the next card" affordance. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {topics.map((t) => (
          <li key={t.id} className="w-[248px] shrink-0 snap-start sm:w-[268px]">
            <NicheCard
              topic={t}
              selected={selected.has(t.id)}
              favourite={favourites?.has(t.id)}
              matchScore={matchScores?.get(t.id)}
              onToggle={onToggle}
              onDetails={onDetails}
              onFavourite={onFavourite}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
