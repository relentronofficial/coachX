'use client';

/**
 * Search empty state.
 *
 * A dead end is the worst outcome in a 10,000-item library, so this never just
 * says "no results": it offers the closest niches the engine can still reach
 * (the search is typo-tolerant, so a near miss usually still resolves), the
 * categories whose names match, and a way out via the AI suggestions.
 */

import { iconForCategory } from '@/lib/nicheAI/discovery';
import type { EnrichedTopic, NavCategory } from '@/lib/nicheAI/topicEngine';

export function EmptyState({
  query,
  similar,
  categories,
  suggestions,
  onPickSuggestion,
  onDetails,
  onClear,
}: {
  query: string;
  similar: EnrichedTopic[];
  categories: { category: NavCategory; group: string }[];
  suggestions: string[];
  onPickSuggestion: (q: string) => void;
  onDetails: (t: EnrichedTopic) => void;
  onClear: () => void;
}) {
  return (
    <div className="cx-glass mt-4 p-6 sm:p-8" data-testid="nf-empty-state" role="status">
      <div className="text-center">
        <div aria-hidden="true" className="text-4xl">
          🔍
        </div>
        <h3 className="mt-3 text-lg font-extrabold" style={{ color: 'var(--cx-text)' }}>
          We couldn&apos;t find an exact match.
        </h3>
        <p className="cx-muted mx-auto mt-1.5 max-w-md text-sm">
          Nothing matched <strong style={{ color: 'var(--cx-text)' }}>“{query}”</strong> exactly — but these are close,
          and there are 10,000+ more to explore.
        </p>
      </div>

      {suggestions.length ? (
        <div className="mt-5">
          <p className="cx-muted mb-2 text-[10px] font-bold uppercase tracking-wide">Try searching for</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onPickSuggestion(s)}
                className="cx-chip cx-focus !px-3.5 !py-2 !text-xs"
                data-testid="nf-empty-suggestion"
              >
                💡 {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {similar.length ? (
        <div className="mt-5">
          <p className="cx-muted mb-2 text-[10px] font-bold uppercase tracking-wide">Similar niches</p>
          <div className="flex flex-wrap gap-2">
            {similar.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onDetails(t)}
                className="cx-chip cx-focus !px-3.5 !py-2 !text-xs"
                data-testid="nf-empty-similar"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {categories.length ? (
        <div className="mt-5">
          <p className="cx-muted mb-2 text-[10px] font-bold uppercase tracking-wide">Related categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ category, group }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onPickSuggestion(category.name)}
                className="cx-chip cx-focus !px-3.5 !py-2 !text-xs"
              >
                <span aria-hidden="true">{iconForCategory(category.name, group)}</span>
                {category.name}
                <span className="cx-muted">{category.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 text-center">
        <button type="button" onClick={onClear} className="cx-btn cx-btn-ghost cx-focus !py-2 text-xs">
          ← Back to browsing
        </button>
      </div>
    </div>
  );
}
