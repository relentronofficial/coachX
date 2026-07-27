import { niches, categoryName, type Niche, type Audience, type Delivery, type Goal } from './niches';

export interface NicheAnswers {
  categories: string[];
  audience: Audience | null;
  delivery: Delivery[];
  goal: Goal | null;
  background: string;
}

export interface NicheMatch {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  blurb: string;
  subNiches: string[];
  matchPercent: number;
  demand: number;
  reasons: string[];
}

export interface NicheResult {
  matches: NicheMatch[];
  /** True when no answer produced a strong signal — UI shows a gentle empty state. */
  weak: boolean;
  topCategory: string | null;
}

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Tokenise free-text background into lowercase word stems for keyword overlap. */
function tokens(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Deterministic, explainable scoring. Weights:
 *   category interest 45 · audience fit 20 · delivery fit 20 · background 15
 * Goal nudges higher-demand niches. Every point is traceable via `reasons`.
 */
export function scoreNiches(answers: NicheAnswers): NicheResult {
  const bg = tokens(answers.background);
  const wantCats = new Set(answers.categories);
  const wantDelivery = new Set(answers.delivery);

  let anySignal = false;

  const scored = niches.map((niche: Niche) => {
    const reasons: string[] = [];
    let raw = 8; // small base so results are never all-zero

    // Category interest (biggest lever).
    if (wantCats.has(niche.categoryId)) {
      raw += 45;
      reasons.push(`Matches your interest in ${categoryName(niche.categoryId)}`);
      anySignal = true;
    }

    // Audience fit.
    if (answers.audience && niche.audiences.includes(answers.audience)) {
      raw += 20;
      reasons.push('Fits the audience you want to help');
      anySignal = true;
    }

    // Delivery fit (partial credit up to the cap).
    if (wantDelivery.size) {
      const overlap = niche.deliveries.filter((d) => wantDelivery.has(d)).length;
      if (overlap > 0) {
        raw += Math.min(20, overlap * 8);
        reasons.push('Works with how you want to coach');
        anySignal = true;
      }
    }

    // Background keyword overlap.
    if (bg.length) {
      const hay = new Set([...niche.keywords, ...niche.subNiches.join(' ').toLowerCase().split(/\s+/)]);
      const hits = bg.filter((t) => hay.has(t)).length;
      if (hits > 0) {
        raw += Math.min(15, hits * 6);
        reasons.push('Connects to your stated background');
        anySignal = true;
      }
    }

    // Goal nudge toward demand.
    if (answers.goal === 'replace-income' || answers.goal === 'scale') {
      raw += (niche.demand - 3) * 2; // reward higher-demand niches
    } else if (answers.goal === 'authority') {
      if (niche.deliveries.includes('content')) raw += 4;
    }

    return {
      id: niche.id,
      title: niche.title,
      categoryId: niche.categoryId,
      categoryName: categoryName(niche.categoryId),
      blurb: niche.blurb,
      subNiches: niche.subNiches,
      matchPercent: clampPct(raw),
      demand: niche.demand,
      reasons: reasons.length ? reasons : ['A broad, beginner-friendly option'],
    } satisfies NicheMatch;
  });

  scored.sort((a, b) => b.matchPercent - a.matchPercent || b.demand - a.demand);
  const matches = scored.slice(0, 6);

  return {
    matches,
    weak: !anySignal,
    topCategory: matches[0]?.categoryName ?? null,
  };
}

/** Basic server-side validation so the API rejects malformed payloads. */
export function validateAnswers(input: unknown): { ok: true; value: NicheAnswers } | { ok: false; error: string } {
  if (typeof input !== 'object' || input === null) return { ok: false, error: 'Body must be a JSON object.' };
  const a = input as Record<string, unknown>;
  const categories = Array.isArray(a.categories) ? a.categories.filter((x) => typeof x === 'string') : [];
  const delivery = Array.isArray(a.delivery) ? a.delivery.filter((x) => typeof x === 'string') : [];
  if (categories.length === 0) return { ok: false, error: 'Select at least one area of interest.' };
  const value: NicheAnswers = {
    categories: categories as string[],
    audience: (typeof a.audience === 'string' ? a.audience : null) as Audience | null,
    delivery: delivery as Delivery[],
    goal: (typeof a.goal === 'string' ? a.goal : null) as Goal | null,
    background: typeof a.background === 'string' ? a.background.slice(0, 500) : '',
  };
  return { ok: true, value };
}
