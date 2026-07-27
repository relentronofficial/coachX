import type { Answers, AnswerValue, Question, ResultData } from './types';

/**
 * Pure engine helpers shared by every tool: step validation and dimension
 * scoring. Kept framework-free so they are trivially unit-testable.
 */

/** Is a single step's answer valid/complete? */
export function isAnswered(q: Question, value: AnswerValue | undefined): boolean {
  const required = q.required ?? q.type !== 'text';
  if (!required) return true;
  switch (q.type) {
    case 'single':
      return typeof value === 'string' && value.length > 0;
    case 'multi':
      return Array.isArray(value) && value.length >= (q.min ?? 1);
    case 'scale':
      return typeof value === 'number' && Number.isFinite(value);
    case 'text':
      return typeof value === 'string' && value.trim().length > 0;
    default:
      return false;
  }
}

/** Validate the whole answer set against the step list. */
export function validateAll(steps: Question[], answers: Answers): { ok: boolean; firstInvalid: number } {
  for (let i = 0; i < steps.length; i++) {
    if (!isAnswered(steps[i], answers[steps[i].id])) return { ok: false, firstInvalid: i };
  }
  return { ok: true, firstInvalid: -1 };
}

/**
 * Compute normalized 0–100 scores per dimension from option `scores` and
 * `scale` answers. `max` per dimension is the maximum obtainable, so a perfect
 * set of answers yields 100.
 */
export function scoreDimensions(steps: Question[], answers: Answers): Record<string, number> {
  const raw: Record<string, number> = {};
  const max: Record<string, number> = {};
  const addRaw = (d: string, v: number) => (raw[d] = (raw[d] ?? 0) + v);
  const addMax = (d: string, v: number) => (max[d] = (max[d] ?? 0) + v);

  for (const q of steps) {
    const a = answers[q.id];

    if (q.type === 'single' && q.options) {
      const perDimMax: Record<string, number> = {};
      for (const o of q.options) {
        for (const [d, v] of Object.entries(o.scores ?? {})) perDimMax[d] = Math.max(perDimMax[d] ?? 0, v);
      }
      for (const [d, v] of Object.entries(perDimMax)) addMax(d, v);
      const sel = q.options.find((o) => o.value === a);
      if (sel) for (const [d, v] of Object.entries(sel.scores ?? {})) addRaw(d, v);
    } else if (q.type === 'multi' && q.options) {
      for (const o of q.options) {
        for (const [d, v] of Object.entries(o.scores ?? {})) addMax(d, v);
      }
      const arr = Array.isArray(a) ? a : [];
      for (const o of q.options) {
        if (arr.includes(o.value)) for (const [d, v] of Object.entries(o.scores ?? {})) addRaw(d, v);
      }
    } else if (q.type === 'scale' && q.dimension && q.scale) {
      const val = typeof a === 'number' ? a : q.scale.min;
      addRaw(q.dimension, val - q.scale.min);
      addMax(q.dimension, q.scale.max - q.scale.min);
    }
  }

  const out: Record<string, number> = {};
  for (const d of new Set([...Object.keys(raw), ...Object.keys(max)])) {
    out[d] = max[d] ? Math.round((raw[d] ?? 0) / max[d] * 100) : 0;
  }
  return out;
}

/** Average of selected dimension scores (helper for an overall %). */
export function overallOf(dimScores: Record<string, number>, dims?: string[]): number {
  const keys = dims ?? Object.keys(dimScores);
  if (keys.length === 0) return 0;
  return Math.round(keys.reduce((s, k) => s + (dimScores[k] ?? 0), 0) / keys.length);
}

/** Map an overall 0–100 to a named level band. */
export function levelBand(overall: number, bands: { min: number; level: string; blurb: string }[]): { level: string; blurb: string } {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  for (const b of sorted) if (overall >= b.min) return { level: b.level, blurb: b.blurb };
  const last = sorted[sorted.length - 1];
  return { level: last.level, blurb: last.blurb };
}

/* -------------------------------------------------------------------------- */
/*  Clarity advice — result interpretation shared by every tool                */
/* -------------------------------------------------------------------------- */

/** Score (percent) at or above which an area no longer needs a clarity nudge. */
export const CLARITY_THRESHOLD = 50;

/** One scored area (trait / dimension / pillar) lifted out of a tool result. */
export interface ClarityArea {
  label: string;
  score: number;
}

/**
 * Which low-clarity case a result falls into, and the areas that triggered it.
 * `clarityAdvice` returns `null` when every area clears the threshold, which is
 * the signal not to render the recommendation at all.
 */
export interface ClarityAdvice {
  /** 'critical' whenever at least one area scored exactly 0%. */
  severity: 'critical' | 'warning';
  /** zero → some area is 0% · multiple → 2+ low areas · single → exactly one. */
  variant: 'zero' | 'multiple' | 'single';
  /** Areas at exactly 0%. */
  zeroAreas: ClarityArea[];
  /** Every area below the threshold — zeros included — sorted WORST FIRST. */
  lowAreas: ClarityArea[];
  /** The joint-lowest areas. Ties are all kept, never broken arbitrarily. */
  weakest: ClarityArea[];
  /** Headline score for the whole assessment (0–100). */
  overall: number;
}

/**
 * Flatten any `ResultData` into its comparable per-area scores. Each result
 * `kind` names its areas differently (traits / dimensions / pillars); the
 * `challenge` kind has no areas at all, only one overall percentage, so it is
 * treated as a single area.
 */
export function scoredAreas(data: ResultData): ClarityArea[] {
  switch (data.kind) {
    case 'persona':
      return data.traits.map((t) => ({ label: t.label, score: t.value }));
    case 'scorecard':
      return data.dimensions.map((d) => ({ label: d.label, score: d.score }));
    case 'blueprint':
      return data.pillars.map((p) => ({ label: p.label, score: p.score }));
    case 'challenge':
      return [{ label: 'Overall progress', score: data.percent }];
  }
}

/**
 * Decide whether a result should point the user at a free strategy call, and
 * with what urgency. Pure and deterministic: the card is only a rendering of
 * this, so the display rule is testable without touching React.
 *
 * A 0% area always wins over "several areas are low" — the spec treats no
 * clarity at all as the higher-priority message.
 */
export function clarityAdvice(data: ResultData): ClarityAdvice | null {
  const areas = scoredAreas(data);
  // Worst first, so the biggest gap always reads at the top of the card.
  const lowAreas = areas.filter((a) => a.score < CLARITY_THRESHOLD).sort((a, b) => a.score - b.score);
  if (!lowAreas.length) return null;
  const zeroAreas = lowAreas.filter((a) => a.score === 0);
  return {
    severity: zeroAreas.length ? 'critical' : 'warning',
    variant: zeroAreas.length ? 'zero' : lowAreas.length > 1 ? 'multiple' : 'single',
    zeroAreas,
    lowAreas,
    weakest: weakestAreas(areas),
    overall: overallScore(data),
  };
}

/**
 * The joint-lowest scoring areas. When several areas tie for last place they
 * are *all* returned — picking one arbitrarily would tell the user (and the
 * coach) that one topic matters more than an equally weak sibling.
 */
export function weakestAreas(areas: ClarityArea[]): ClarityArea[] {
  if (!areas.length) return [];
  const min = Math.min(...areas.map((a) => a.score));
  return areas.filter((a) => a.score === min);
}

/**
 * One headline 0–100 for any result kind. `scorecard`/`blueprint` carry their
 * own `overall` and `challenge` its `percent`; `persona` has no headline number
 * at all, so the mean of its traits stands in — which keeps every booking
 * payload comparable regardless of which tool produced it.
 */
export function overallScore(data: ResultData): number {
  switch (data.kind) {
    case 'scorecard':
    case 'blueprint':
      return data.overall;
    case 'challenge':
      return data.percent;
    case 'persona': {
      const areas = scoredAreas(data);
      if (!areas.length) return 0;
      return Math.round(areas.reduce((sum, a) => sum + a.score, 0) / areas.length);
    }
  }
}
