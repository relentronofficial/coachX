'use client';

/**
 * Client-side topic stats (localStorage): favourites, recently-selected,
 * learned selection counts (popularity) and search analytics. Powers the
 * explorer's Popular / Trending / Recommended / Recents views and the admin
 * topic analytics, and lets recommendations "learn" from prior use on-device.
 * Selections are also logged to Firestore analytics for cross-user aggregation.
 */

const FAV = 'cx-topic-favs';
const BOOKMARK = 'cx-topic-bookmarks';
const RECENT = 'cx-topic-recents';
const VIEWED = 'cx-topic-viewed';
const COUNTS = 'cx-topic-counts';
const SEARCH = 'cx-topic-search';
const RECENT_CAP = 40;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

// ---- Favourites ----
export function readFavourites(): Set<string> {
  return new Set(read<string[]>(FAV, []));
}
export function toggleFavourite(id: string): boolean {
  const favs = readFavourites();
  const on = !favs.has(id);
  if (on) favs.add(id);
  else favs.delete(id);
  write(FAV, [...favs]);
  return on;
}

// ---- Recently selected ----
export function readRecents(): string[] {
  return read<string[]>(RECENT, []);
}
export function pushRecent(id: string): void {
  const next = [id, ...readRecents().filter((x) => x !== id)].slice(0, RECENT_CAP);
  write(RECENT, next);
}

/**
 * Bookmarks are deliberately separate from favourites: a favourite is "this is
 * me", a bookmark is "come back to this". Users treat them differently when
 * narrowing thousands of topics, so collapsing them into one list loses intent.
 */
export function readBookmarks(): Set<string> {
  return new Set(read<string[]>(BOOKMARK, []));
}
export function toggleBookmark(id: string): boolean {
  const marks = readBookmarks();
  const on = !marks.has(id);
  if (on) marks.add(id);
  else marks.delete(id);
  write(BOOKMARK, [...marks]);
  return on;
}

// ---- Recently viewed (inspected, not necessarily selected) ----
export function readViewed(): string[] {
  return read<string[]>(VIEWED, []);
}
export function pushViewed(id: string): void {
  const next = [id, ...readViewed().filter((x) => x !== id)].slice(0, RECENT_CAP);
  write(VIEWED, next);
}

// ---- Learned selection counts (popularity) ----
export function readCounts(): Record<string, number> {
  return read<Record<string, number>>(COUNTS, {});
}
export function bumpCount(id: string, by = 1): void {
  const c = readCounts();
  c[id] = (c[id] ?? 0) + by;
  write(COUNTS, c);
}
export function popularityMap(): Map<string, number> {
  return new Map(Object.entries(readCounts()));
}

/**
 * Recommendation analytics: how often AI-suggested topics are shown versus
 * actually accepted. Admins use the accept rate to judge whether the
 * recommender is earning its place in the flow.
 */
const REC = 'cx-topic-recs';
export interface RecStats { shown: Record<string, number>; accepted: Record<string, number> }
export function readRecStats(): RecStats {
  return read<RecStats>(REC, { shown: {}, accepted: {} });
}
export function bumpRecShown(ids: string[]): void {
  if (!ids.length) return;
  const s = readRecStats();
  for (const id of ids) s.shown[id] = (s.shown[id] ?? 0) + 1;
  write(REC, s);
}
export function bumpRecAccepted(id: string): void {
  const s = readRecStats();
  s.accepted[id] = (s.accepted[id] ?? 0) + 1;
  write(REC, s);
}

// ---- Search analytics ----
export function readSearches(): Record<string, number> {
  return read<Record<string, number>>(SEARCH, {});
}
export function bumpSearch(query: string): void {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return;
  const s = readSearches();
  s[q] = (s[q] ?? 0) + 1;
  write(SEARCH, s);
  pushRecentSearch(q);
}

/**
 * Search *history* is kept separately from the search counts above: counts
 * answer "what is popular", history answers "what did I just look at". The
 * discovery search surfaces both, and they rank differently.
 */
const SEARCH_RECENT = 'cx-topic-search-recent';
const SEARCH_RECENT_CAP = 8;

export function readRecentSearches(): string[] {
  return read<string[]>(SEARCH_RECENT, []);
}
export function pushRecentSearch(query: string): void {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return;
  write(SEARCH_RECENT, [q, ...readRecentSearches().filter((x) => x !== q)].slice(0, SEARCH_RECENT_CAP));
}
export function clearRecentSearches(): void {
  write(SEARCH_RECENT, []);
}

/** Most-run searches on this device, most frequent first. */
export function popularSearches(limit = 6): string[] {
  return Object.entries(readSearches())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([q]) => q);
}
