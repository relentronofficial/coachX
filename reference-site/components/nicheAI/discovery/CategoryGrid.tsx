'use client';

/**
 * Visual category explorer — step one of the progressive navigation.
 *
 * Replaces the "wall of 10,000 chips" problem with ~200 category cards grouped
 * under their 13 top-level groups, each showing its own niche count so the size
 * of the library reads as *organised* rather than overwhelming.
 *
 * Cards are plain buttons with `data-active` rather than `aria-pressed`: inside
 * the assessment, `[aria-pressed]` means "this is an answer you can pick", and
 * navigating into a category is not answering the question.
 */

import { iconForCategory, iconForGroup } from '@/lib/nicheAI/discovery';
import type { NavCategory, NavGroup } from '@/lib/nicheAI/topicEngine';

export function CategoryGrid({
  groups,
  onOpenCategory,
  activeGroup,
  onGroup,
}: {
  groups: NavGroup[];
  onOpenCategory: (c: NavCategory) => void;
  /** Empty string = show every group. */
  activeGroup: string;
  onGroup: (g: string) => void;
}) {
  const shown = activeGroup ? groups.filter((g) => g.name === activeGroup) : groups;

  return (
    <section aria-label="Browse by category" data-testid="nf-category-explorer">
      {/* Group filter — horizontally scrollable on mobile, large touch targets. */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="Filter by area">
        <button
          type="button"
          onClick={() => onGroup('')}
          data-active={activeGroup === ''}
          data-testid="nf-group-all"
          className="cx-chip cx-focus shrink-0 snap-start !px-4 !py-2 !text-xs"
          style={activeGroup === '' ? { background: 'var(--cx-brand)', color: '#fff' } : undefined}
        >
          All areas
        </button>
        {groups.map((g) => (
          <button
            key={g.name}
            type="button"
            onClick={() => onGroup(activeGroup === g.name ? '' : g.name)}
            data-active={activeGroup === g.name}
            className="cx-chip cx-focus shrink-0 snap-start !px-4 !py-2 !text-xs"
            style={activeGroup === g.name ? { background: 'var(--cx-brand)', color: '#fff' } : undefined}
          >
            <span aria-hidden="true">{iconForGroup(g.name)}</span>
            {g.name}
          </button>
        ))}
      </div>

      {shown.map((g) => (
        <div key={g.name} className="mt-5">
          <div className="mb-2.5 flex items-baseline gap-2">
            <h3 className="text-sm font-extrabold" style={{ color: 'var(--cx-text)' }}>
              <span aria-hidden="true" className="mr-1.5">
                {iconForGroup(g.name)}
              </span>
              {g.name}
            </h3>
            <span className="cx-muted text-[11px] font-semibold">{g.count.toLocaleString()} niches</span>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {g.categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onOpenCategory(c)}
                  data-testid="nf-category-card"
                  className="cx-option cx-focus h-full !flex-col !items-start !gap-1.5 !p-3.5"
                >
                  <span aria-hidden="true" className="text-xl">
                    {iconForCategory(c.name, g.name)}
                  </span>
                  <span className="text-[12.5px] font-bold leading-snug" style={{ color: 'var(--cx-text)' }}>
                    {c.name}
                  </span>
                  <span className="cx-muted mt-auto text-[11px] font-semibold">
                    {c.count.toLocaleString()} {c.count === 1 ? 'niche' : 'niches'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/** Step two — the subcategories inside one category. */
export function SubcategoryGrid({
  category,
  group,
  onOpenSub,
  onBrowseAll,
}: {
  category: NavCategory;
  group: string;
  onOpenSub: (sub: string) => void;
  onBrowseAll: () => void;
}) {
  return (
    <section aria-label={`${category.name} subcategories`} data-testid="nf-subcategory-explorer">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-extrabold" style={{ color: 'var(--cx-text)' }}>
          <span aria-hidden="true" className="mr-1.5">
            {iconForCategory(category.name, group)}
          </span>
          {category.name}
        </h3>
        <span className="cx-muted text-[11px] font-semibold">
          {category.subs.length} groups · {category.count.toLocaleString()} niches
        </span>
        <button type="button" onClick={onBrowseAll} className="cx-chip cx-focus ml-auto !px-3 !py-1.5 !text-[11px]">
          View all {category.count.toLocaleString()} →
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {category.subs.map((s) => (
          <li key={s.name}>
            <button
              type="button"
              onClick={() => onOpenSub(s.name)}
              data-testid="nf-subcategory-card"
              className="cx-option cx-focus h-full !flex-col !items-start !gap-1 !p-3.5"
            >
              <span className="text-[12.5px] font-bold leading-snug" style={{ color: 'var(--cx-text)' }}>
                {s.name}
              </span>
              <span className="cx-muted mt-auto text-[11px] font-semibold">
                {s.count.toLocaleString()} {s.count === 1 ? 'niche' : 'niches'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
