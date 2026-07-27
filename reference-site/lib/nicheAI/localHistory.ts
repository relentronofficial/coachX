'use client';

/**
 * Local mirror of completed results so History / Compare / Favourites work even
 * without Firebase (offline dev). When Firebase is configured, Firestore is the
 * source of truth and this is a resilient cache. Capped to the last 30 results.
 */

import type { AnalysisResult } from './types';

const KEY = 'cx-niche-ai-history';
const FAV_KEY = 'cx-niche-ai-favs';
const CAP = 30;

export interface LocalResult extends AnalysisResult {
  _id: string;
  savedAt: string;
}

export function readLocalHistory(): LocalResult[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as LocalResult[];
  } catch {
    return [];
  }
}

export function addLocalResult(result: AnalysisResult): void {
  try {
    const rows = readLocalHistory();
    const row: LocalResult = { ...result, _id: result.id, savedAt: new Date().toISOString() };
    const next = [row, ...rows.filter((r) => r._id !== row._id)].slice(0, CAP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function removeLocalResult(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(readLocalHistory().filter((r) => r._id !== id)));
  } catch {
    /* ignore */
  }
}

export function readFavourites(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function toggleLocalFavourite(id: string): boolean {
  const favs = readFavourites();
  const next = !favs.has(id);
  if (next) favs.add(id);
  else favs.delete(id);
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
  } catch {
    /* ignore */
  }
  return next;
}
