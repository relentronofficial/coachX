'use client';

/**
 * Niche discovery — the shared experience behind both entry points.
 *
 * `mode="browse"`  public exploration on /niche-finder (hero + rails + explorer)
 * `mode="select"`  the assessment's topic step (same UI, plus tray + profile)
 *
 * The design answer to "10,000 niches is overwhelming" is progressive
 * disclosure: nothing shows a flat list until the user has narrowed to a
 * subcategory or searched. The default view is a handful of reasoned
 * recommendations plus ~200 counted category cards.
 *
 *   home → category → subcategory → niche list → details drawer
 *
 * Every heavy operation (search, rails, filtering) runs against indexes the
 * engine builds once at module load, and the deep list is virtualized, so the
 * size of the library never reaches the DOM.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_TOPICS,
  CATEGORIES,
  NAV,
  buildInterestProfile,
  recommendTopics,
  searchTopics,
  suggestSearch,
  similarTopics,
  topicById,
  type EnrichedTopic,
  type NavCategory,
} from '@/lib/nicheAI/topicEngine';
import { loadTopicOverrides } from '@/lib/nicheAI/topicStore';
import {
  bumpCount,
  bumpSearch,
  popularityMap,
  pushRecent,
  pushViewed,
  readFavourites,
  toggleFavourite,
} from '@/lib/nicheAI/topicStats';
import { affinityScore, RAILS, railTopics, type RailId } from '@/lib/nicheAI/discovery';
import { InterestProfilePanel } from '../InterestProfilePanel';
import { TopicDrawer } from '../TopicDrawer';
import { CategoryGrid, SubcategoryGrid } from './CategoryGrid';
import { DiscoveryFilters, EMPTY_FILTERS, matchesFilters, type DiscoveryFilterState } from './DiscoveryFilters';
import { DiscoveryHero } from './DiscoveryHero';
import { DiscoveryRail } from './DiscoveryRail';
import { EmptyState } from './EmptyState';
import { NicheGrid } from './NicheGrid';
import { SmartSearch } from './SmartSearch';

const MAX_SELECT = 50;

type View =
  | { kind: 'home' }
  | { kind: 'category'; categoryId: string }
  | { kind: 'list'; categoryId: string; sub?: string }
  | { kind: 'search'; query: string }
  | { kind: 'rail'; railId: RailId };

export function NicheDiscovery({
  mode = 'browse',
  value = [],
  onChange,
  min = 1,
  header,
}: {
  mode?: 'browse' | 'select';
  value?: string[];
  onChange?: (v: string[]) => void;
  min?: number;
  /** Rendered under the hero in browse mode (e.g. the Start assessment CTA). */
  header?: React.ReactNode;
}) {
  const selectable = mode === 'select';

  const [view, setView] = useState<View>({ kind: 'home' });
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState<DiscoveryFilterState>(EMPTY_FILTERS);
  const [drawer, setDrawer] = useState<EnrichedTopic | null>(null);
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [custom, setCustom] = useState<EnrichedTopic[]>([]);
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map());
  const [maxHit, setMaxHit] = useState(false);
  // Browse mode keeps its own shortlist so exploring is still useful signed-out.
  const [localPicks, setLocalPicks] = useState<string[]>([]);
  const topRef = useRef<HTMLDivElement>(null);
  const navigated = useRef(false);

  const picks = selectable ? value : localPicks;

  /**
   * Bring the new view into sight when the user navigates.
   *
   * Without this, clicking a category card near the bottom of a long page
   * swaps in a much shorter view and leaves the viewport parked below all of
   * it — the user lands staring at blank space. Skipped on first render so the
   * page does not steal scroll on mount.
   */
  useEffect(() => {
    if (!navigated.current) {
      navigated.current = true;
      return;
    }
    const el = topRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, y - 12), behavior: 'smooth' });
  }, [view]);

  useEffect(() => {
    void loadTopicOverrides().then((o) => {
      setDisabled(o.disabled);
      setCustom(o.custom);
    });
    setFavourites(readFavourites());
    setPopularity(popularityMap());
  }, []);

  const pool = useMemo(
    () => [...ALL_TOPICS.filter((t) => !disabled.has(t.id)), ...custom],
    [disabled, custom],
  );
  const byId = useMemo(() => new Map(pool.map((t) => [t.id, t])), [pool]);
  const lookup = useCallback((id: string) => byId.get(id) ?? topicById.get(id), [byId]);

  const selected = useMemo(() => new Set(picks), [picks]);
  const selectedTopics = useMemo(() => picks.map(lookup).filter(Boolean) as EnrichedTopic[], [picks, lookup]);

  const industries = useMemo(() => Array.from(new Set(pool.map((t) => t.industry))).sort(), [pool]);

  const recommended = useMemo(
    () => (picks.length ? recommendTopics(picks, popularity, 12) : []),
    [picks, popularity],
  );

  /** Match scores only exist once there is a profile to match against. */
  const matchScores = useMemo(() => {
    if (!selectedTopics.length) return undefined;
    const m = new Map<string, number>();
    for (const t of recommended) {
      const s = affinityScore(t, selectedTopics);
      if (typeof s === 'number') m.set(t.id, s);
    }
    return m;
  }, [recommended, selectedTopics]);

  const setPicks = useCallback(
    (next: string[]) => {
      if (selectable) onChange?.(next);
      else setLocalPicks(next);
    },
    [selectable, onChange],
  );

  const toggle = useCallback(
    (id: string) => {
      if (selected.has(id)) {
        setPicks(picks.filter((x) => x !== id));
        setMaxHit(false);
        return;
      }
      if (picks.length >= MAX_SELECT) {
        setMaxHit(true);
        return;
      }
      setPicks([...picks, id]);
      bumpCount(id);
      pushRecent(id);
      setPopularity(popularityMap());
    },
    [picks, selected, setPicks],
  );

  const openDetails = useCallback((t: EnrichedTopic) => {
    setDrawer(t);
    pushViewed(t.id);
  }, []);

  const onFavourite = useCallback((id: string) => {
    toggleFavourite(id);
    setFavourites(readFavourites());
  }, []);

  const runSearch = useCallback((q: string) => {
    const query = q.trim();
    if (!query) {
      setView({ kind: 'home' });
      return;
    }
    bumpSearch(query);
    setView({ kind: 'search', query });
  }, []);

  // ---- Current result set -------------------------------------------------

  const category: NavCategory | undefined = useMemo(() => {
    const id = view.kind === 'category' || view.kind === 'list' ? view.categoryId : null;
    if (!id) return undefined;
    for (const g of NAV) {
      const c = g.categories.find((x) => x.id === id);
      if (c) return c;
    }
    return undefined;
  }, [view]);

  const categoryGroup = useMemo(
    () => CATEGORIES.find((c) => c.id === category?.id)?.group ?? '',
    [category],
  );

  const results = useMemo(() => {
    let base: EnrichedTopic[] = [];
    if (view.kind === 'search') base = searchTopics(view.query, 600).filter((t) => !disabled.has(t.id));
    else if (view.kind === 'list')
      base = pool.filter((t) => t.categoryId === view.categoryId && (!view.sub || t.subcategory === view.sub));
    else if (view.kind === 'rail') base = railTopics(view.railId, pool, { popularity, recommended }, 200);
    else return [];
    return base.filter((t) => matchesFilters(t, filters));
  }, [view, pool, disabled, filters, popularity, recommended]);

  const showList = view.kind === 'search' || view.kind === 'list' || view.kind === 'rail';

  // ---- Breadcrumbs --------------------------------------------------------

  const crumbs: { label: string; go: () => void }[] = [];
  if (view.kind !== 'home') crumbs.push({ label: 'All niches', go: () => setView({ kind: 'home' }) });
  if (category) {
    crumbs.push({
      label: category.name,
      go: () => setView({ kind: 'category', categoryId: category.id }),
    });
    if (view.kind === 'list' && view.sub) crumbs.push({ label: view.sub, go: () => undefined });
  }
  if (view.kind === 'search') crumbs.push({ label: `“${view.query}”`, go: () => undefined });
  if (view.kind === 'rail') {
    const r = RAILS.find((x) => x.id === view.railId);
    if (r) crumbs.push({ label: r.title, go: () => undefined });
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div data-testid="nf-discovery" data-mode={mode}>
      {mode === 'browse' && view.kind === 'home' ? <DiscoveryHero>{header}</DiscoveryHero> : null}

      {/* Scroll anchor — every navigation brings this back into view. */}
      <div ref={topRef} aria-hidden="true" />

      {/* Sticky search — stays reachable however far the user has scrolled. */}
      <div
        className="sticky top-0 z-20 -mx-4 mt-6 px-4 py-3 sm:mx-0 sm:px-0"
        style={{ background: 'linear-gradient(180deg, var(--cx-bg) 70%, transparent)' }}
      >
        <SearchRow
          input={input}
          setInput={setInput}
          runSearch={runSearch}
          selectable={selectable}
          count={picks.length}
          min={min}
        />
      </div>

      {crumbs.length ? (
        <nav aria-label="Breadcrumb" className="mt-1 flex flex-wrap items-center gap-1.5" data-testid="nf-breadcrumbs">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? (
                <span aria-hidden="true" className="cx-muted text-[11px]">
                  ›
                </span>
              ) : null}
              {i < crumbs.length - 1 ? (
                <button type="button" onClick={c.go} className="cx-focus text-[11px] font-bold underline" style={{ color: 'var(--cx-gold)' }}>
                  {c.label}
                </button>
              ) : (
                <span className="text-[11px] font-bold" style={{ color: 'var(--cx-text)' }}>
                  {c.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      {maxHit ? (
        <p className="cx-glass mt-3 p-3 text-xs font-semibold" role="alert" style={{ color: 'var(--cx-gold)' }}>
          You&apos;ve reached the {MAX_SELECT}-topic limit. Remove one to add another.
        </p>
      ) : null}

      {/* ---- Home: rails + category explorer ---- */}
      {view.kind === 'home' ? (
        <>
          {RAILS.map((rail) => {
            const topics = railTopics(rail.id, pool, { popularity, recommended }, 12);
            return (
              <DiscoveryRail
                key={rail.id}
                rail={rail}
                topics={topics}
                selected={selected}
                favourites={favourites}
                matchScores={matchScores}
                onToggle={toggle}
                onDetails={openDetails}
                onFavourite={onFavourite}
                onSeeAll={rail.id === 'recommended' ? undefined : () => setView({ kind: 'rail', railId: rail.id })}
              />
            );
          })}

          <div className="mt-8">
            <h2 className="text-base font-extrabold" style={{ color: 'var(--cx-text)' }}>
              Browse every category
            </h2>
            <p className="cx-muted mb-3 mt-0.5 text-xs">
              {CATEGORIES.length} categories, organised into 13 areas. Pick one to narrow down.
            </p>
            <CategoryGrid
              groups={NAV}
              activeGroup=""
              onGroup={() => undefined}
              onOpenCategory={(c) => setView({ kind: 'category', categoryId: c.id })}
            />
          </div>
        </>
      ) : null}

      {/* ---- Category: its subcategories ---- */}
      {view.kind === 'category' && category ? (
        <div className="mt-4">
          <SubcategoryGrid
            category={category}
            group={categoryGroup}
            onOpenSub={(sub) => setView({ kind: 'list', categoryId: category.id, sub })}
            onBrowseAll={() => setView({ kind: 'list', categoryId: category.id })}
          />
        </div>
      ) : null}

      {/* ---- Niche list (search / subcategory / rail) ---- */}
      {showList ? (
        <div className="mt-4">
          <DiscoveryFilters value={filters} onChange={setFilters} industries={industries} resultCount={results.length} />
          {results.length ? (
            <div className="mt-3">
              <NicheGrid
                topics={results}
                selected={selected}
                favourites={favourites}
                query={view.kind === 'search' ? view.query : ''}
                matchScores={matchScores}
                onToggle={toggle}
                onDetails={openDetails}
                onFavourite={onFavourite}
              />
            </div>
          ) : view.kind === 'search' ? (
            <EmptyState
              query={view.query}
              similar={nearestTopics(view.query, pool)}
              categories={matchingCategories(view.query)}
              suggestions={suggestSearch(view.query, 5).map((s) => s.text)}
              onPickSuggestion={(q) => {
                setInput(q);
                runSearch(q);
              }}
              onDetails={openDetails}
              onClear={() => {
                setInput('');
                setFilters(EMPTY_FILTERS);
                setView({ kind: 'home' });
              }}
            />
          ) : (
            <p className="cx-glass mt-3 p-4 text-sm" role="status" style={{ color: 'var(--cx-text)' }}>
              No niches match these filters.{' '}
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="cx-focus font-bold underline" style={{ color: 'var(--cx-gold)' }}>
                Clear filters
              </button>
            </p>
          )}
        </div>
      ) : null}

      {/* ---- Selection tray + interest profile (select mode) ---- */}
      {selectable && picks.length ? (
        <div className="mt-8">
          <SelectionTray topics={selectedTopics} onRemove={toggle} onDetails={openDetails} />
          <InterestProfilePanel
            profile={buildInterestProfile(picks, lookup)}
            onToggle={toggle}
            onDrop={(t) => toggle(t.id)}
          />
        </div>
      ) : null}

      {drawer ? (
        <TopicDrawer
          topic={drawer}
          selected={selected}
          onToggle={toggle}
          onClose={() => setDrawer(null)}
          onOpenTopic={openDetails}
          lookup={lookup}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SearchRow({
  input,
  setInput,
  runSearch,
  selectable,
  count,
  min,
}: {
  input: string;
  setInput: (v: string) => void;
  runSearch: (q: string) => void;
  selectable: boolean;
  count: number;
  min: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <SmartSearch value={input} onChange={setInput} onSubmit={runSearch} />
      </div>
      {selectable ? (
        <span
          className="cx-chip shrink-0 !px-3 !py-2 !text-[11px] font-bold"
          data-testid="nf-selection-count"
          aria-live="polite"
          style={count >= min ? { background: 'var(--cx-brand)', color: '#fff' } : undefined}
        >
          {count} picked
        </span>
      ) : null}
    </div>
  );
}

function SelectionTray({
  topics,
  onRemove,
  onDetails,
}: {
  topics: EnrichedTopic[];
  onRemove: (id: string) => void;
  onDetails: (t: EnrichedTopic) => void;
}) {
  return (
    <section className="cx-glass p-4" aria-label="Your selected niches" data-testid="nf-selection-tray">
      <h3 className="mb-2 text-sm font-extrabold" style={{ color: 'var(--cx-text)' }}>
        ✅ Your niches ({topics.length})
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <li key={t.id} className="cx-chip !py-1 !pr-1 !text-[11px]">
            <button type="button" onClick={() => onDetails(t)} className="cx-focus font-semibold">
              {t.label}
            </button>
            <button
              type="button"
              onClick={() => onRemove(t.id)}
              aria-label={`Remove ${t.label}`}
              className="cx-focus rounded-full px-1.5 text-sm leading-none"
              style={{ color: 'var(--cx-muted)' }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Closest topics for a query that returned nothing.
 *
 * Always returns something. A dead end is the worst possible outcome in a
 * 10,000-item library, so when the query is pure gibberish and even the
 * typo-tolerant search gives up, this falls back to the strongest opportunities
 * in the library — "here is something worth looking at" beats "nothing found".
 */
function nearestTopics(query: string, pool: EnrichedTopic[]): EnrichedTopic[] {
  const direct = searchTopics(query, 6);
  if (direct.length) return direct.slice(0, 6);

  const first = suggestSearch(query, 1)[0];
  if (first?.id) {
    const similar = similarTopics(first.id, 6);
    if (similar.length) return similar;
  }
  if (first) {
    const viaSuggestion = searchTopics(first.text, 6);
    if (viaSuggestion.length) return viaSuggestion;
  }
  return [...pool].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 6);
}

/**
 * Categories to offer alongside a failed search. Falls back to the largest
 * categories so this section is never empty either.
 */
function matchingCategories(query: string): { category: NavCategory; group: string }[] {
  const q = query.toLowerCase().trim();
  const head = q.split(/\s+/)[0];
  const out: { category: NavCategory; group: string }[] = [];
  for (const g of NAV) {
    for (const c of g.categories) {
      const name = c.name.toLowerCase();
      if (q && (name.includes(q) || (head.length > 2 && name.includes(head)))) {
        out.push({ category: c, group: g.name });
        if (out.length >= 6) return out;
      }
    }
  }
  if (out.length) return out;
  return NAV.flatMap((g) => g.categories.map((category) => ({ category, group: g.name })))
    .sort((a, b) => b.category.count - a.category.count)
    .slice(0, 6);
}
