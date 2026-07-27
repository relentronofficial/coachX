import { describe, it, expect } from 'vitest';
import {
  isAnswered,
  validateAll,
  scoreDimensions,
  overallOf,
  levelBand,
  clarityAdvice,
  scoredAreas,
  weakestAreas,
  overallScore,
} from '@/lib/tools/engine';
import type { Question, ResultData } from '@/lib/tools/types';

const single: Question = {
  id: 'q1',
  type: 'single',
  title: 't',
  options: [
    { value: 'a', label: 'A', scores: { x: 2 } },
    { value: 'b', label: 'B', scores: { y: 2 } },
  ],
};
const multi: Question = {
  id: 'q2',
  type: 'multi',
  title: 't',
  min: 1,
  options: [
    { value: 'a', label: 'A', scores: { x: 1 } },
    { value: 'b', label: 'B', scores: { x: 1 } },
  ],
};
const scale: Question = { id: 'q3', type: 'scale', title: 't', dimension: 'z', scale: { min: 1, max: 5, minLabel: 'lo', maxLabel: 'hi' } };
const text: Question = { id: 'q4', type: 'text', title: 't' };

describe('isAnswered', () => {
  it('validates single', () => {
    expect(isAnswered(single, undefined)).toBe(false);
    expect(isAnswered(single, 'a')).toBe(true);
  });
  it('respects multi min', () => {
    expect(isAnswered(multi, [])).toBe(false);
    expect(isAnswered(multi, ['a'])).toBe(true);
  });
  it('validates scale', () => {
    expect(isAnswered(scale, undefined)).toBe(false);
    expect(isAnswered(scale, 3)).toBe(true);
  });
  it('treats text as optional by default', () => {
    expect(isAnswered(text, undefined)).toBe(true);
  });
});

describe('validateAll', () => {
  it('finds the first invalid step', () => {
    const res = validateAll([single, multi], { q1: 'a' });
    expect(res.ok).toBe(false);
    expect(res.firstInvalid).toBe(1);
  });
  it('passes when all answered', () => {
    expect(validateAll([single, multi], { q1: 'a', q2: ['a'] }).ok).toBe(true);
  });
});

describe('scoreDimensions', () => {
  it('normalizes single-choice to 0..100', () => {
    const res = scoreDimensions([single], { q1: 'a' });
    expect(res.x).toBe(100);
    expect(res.y).toBe(0);
  });
  it('sums multi selections', () => {
    expect(scoreDimensions([multi], { q2: ['a', 'b'] }).x).toBe(100);
    expect(scoreDimensions([multi], { q2: ['a'] }).x).toBe(50);
  });
  it('maps scale onto its dimension', () => {
    expect(scoreDimensions([scale], { q3: 5 }).z).toBe(100);
    expect(scoreDimensions([scale], { q3: 3 }).z).toBe(50);
    expect(scoreDimensions([scale], { q3: 1 }).z).toBe(0);
  });
});

describe('overallOf & levelBand', () => {
  it('averages dimensions', () => {
    expect(overallOf({ a: 100, b: 0 })).toBe(50);
  });
  it('bands by threshold', () => {
    const bands = [
      { min: 80, level: 'High', blurb: '' },
      { min: 40, level: 'Mid', blurb: '' },
      { min: 0, level: 'Low', blurb: '' },
    ];
    expect(levelBand(90, bands).level).toBe('High');
    expect(levelBand(50, bands).level).toBe('Mid');
    expect(levelBand(10, bands).level).toBe('Low');
  });
});

// ---------------------------------------------------------------------------
// Clarity advice — the display rule behind the "book a free call" card.
// ---------------------------------------------------------------------------

const scorecard = (scores: number[]): ResultData => ({
  kind: 'scorecard',
  overall: overallOf(Object.fromEntries(scores.map((s, i) => [`d${i}`, s]))),
  level: 'L',
  levelBlurb: '',
  dimensions: scores.map((score, i) => ({ id: `d${i}`, label: `Dim ${i}`, score })),
  strengths: [],
  gaps: [],
  recommendations: [],
});

describe('scoredAreas', () => {
  it('reads the scored areas of every result kind', () => {
    expect(scoredAreas({ kind: 'persona', title: '', tagline: '', blurb: '', traits: [{ label: 'T', value: 12 }], strengths: [], watchouts: [], recommendations: [] })).toEqual([
      { label: 'T', score: 12 },
    ]);
    expect(scoredAreas(scorecard([40]))).toEqual([{ label: 'Dim 0', score: 40 }]);
    expect(scoredAreas({ kind: 'blueprint', overall: 0, readiness: '', pillars: [{ id: 'p', label: 'P', score: 30, note: '' }], actions: [] })).toEqual([
      { label: 'P', score: 30 },
    ]);
    // The challenge kind has no per-area breakdown — its single percent stands in.
    expect(scoredAreas({ kind: 'challenge', completed: 1, total: 4, percent: 25, level: '', blurb: '', nextSteps: [] })).toEqual([
      { label: 'Overall progress', score: 25 },
    ]);
  });
});

describe('clarityAdvice', () => {
  it('stays silent when every area is at or above the threshold', () => {
    expect(clarityAdvice(scorecard([50, 80, 100]))).toBeNull();
  });

  it('treats exactly 50% as clear (boundary)', () => {
    expect(clarityAdvice(scorecard([50]))).toBeNull();
    expect(clarityAdvice(scorecard([49]))).not.toBeNull();
  });

  it('flags a 0% area as critical, whatever else scored', () => {
    const advice = clarityAdvice(scorecard([0, 90]))!;
    expect(advice.severity).toBe('critical');
    expect(advice.variant).toBe('zero');
    expect(advice.zeroAreas).toHaveLength(1);
  });

  it('prefers the zero message over the multiple-low message', () => {
    const advice = clarityAdvice(scorecard([0, 20, 30]))!;
    expect(advice.variant).toBe('zero');
    expect(advice.lowAreas).toHaveLength(3); // zeros are included in lowAreas
  });

  it('uses the single variant for exactly one low area', () => {
    const advice = clarityAdvice(scorecard([30, 70, 90]))!;
    expect(advice.severity).toBe('warning');
    expect(advice.variant).toBe('single');
    expect(advice.lowAreas).toEqual([{ label: 'Dim 0', score: 30 }]);
  });

  it('uses the multiple variant for 2+ low areas and still returns one advice', () => {
    const advice = clarityAdvice(scorecard([10, 20, 95]))!;
    expect(advice.variant).toBe('multiple');
    expect(advice.zeroAreas).toHaveLength(0);
    expect(advice.lowAreas).toHaveLength(2);
  });

  it('sorts low areas worst-first so the biggest gap leads', () => {
    const advice = clarityAdvice(scorecard([40, 10, 25]))!;
    expect(advice.lowAreas.map((a) => a.score)).toEqual([10, 25, 40]);
  });
});

describe('weakestAreas', () => {
  it('returns the single lowest area', () => {
    expect(weakestAreas([{ label: 'a', score: 30 }, { label: 'b', score: 10 }, { label: 'c', score: 80 }])).toEqual([
      { label: 'b', score: 10 },
    ]);
  });

  it('returns every area tied for lowest, never just one', () => {
    const tied = weakestAreas([
      { label: 'Pricing Strategy', score: 22 },
      { label: 'Sales Confidence', score: 22 },
      { label: 'Personal Branding', score: 22 },
      { label: 'Delivery', score: 70 },
    ]);
    expect(tied).toHaveLength(3);
    expect(tied.map((a) => a.label)).toEqual(['Pricing Strategy', 'Sales Confidence', 'Personal Branding']);
  });

  it('handles an empty area list', () => {
    expect(weakestAreas([])).toEqual([]);
  });

  it('is surfaced on the advice, ties included', () => {
    const advice = clarityAdvice(scorecard([22, 22, 40]))!;
    expect(advice.weakest.map((a) => a.score)).toEqual([22, 22]);
  });
});

describe('overallScore', () => {
  it('uses the explicit overall for scorecard and blueprint', () => {
    expect(overallScore(scorecard([40, 60]))).toBe(50);
    expect(overallScore({ kind: 'blueprint', overall: 61, readiness: '', pillars: [], actions: [] })).toBe(61);
  });

  it('uses percent for a challenge', () => {
    expect(overallScore({ kind: 'challenge', completed: 1, total: 4, percent: 25, level: '', blurb: '', nextSteps: [] })).toBe(25);
  });

  it('averages traits for a persona, which carries no headline number', () => {
    expect(
      overallScore({
        kind: 'persona',
        title: '',
        tagline: '',
        blurb: '',
        traits: [{ label: 'a', value: 30 }, { label: 'b', value: 61 }],
        strengths: [],
        watchouts: [],
        recommendations: [],
      }),
    ).toBe(46); // (30 + 61) / 2 = 45.5 → 46
  });
});
