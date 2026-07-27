import { describe, expect, it } from 'vitest';
import { analyze, isVisible, visibleQuestions } from '@/lib/nicheAI/engine';
import { seedQuestions } from '@/lib/nicheAI/questionBank';
import type { Answers } from '@/lib/nicheAI/types';

/** A realistic "business/AI oriented" answer set. */
const businessAnswers: Answers = {
  'passion-topics': ['business-entrepreneurship--starting-a-business', 'ai-automation--ai-for-business', 'marketing--digital-marketing'],
  'passion-energy': 5,
  'skills-strong': ['teaching', 'tech', 'sales'],
  'skills-confidence': 4,
  'experience-level': 'seasoned',
  'experience-result': 'Helped a small business automate their marketing with AI tools and ChatGPT.',
  'knowledge-depth': 4,
  'knowledge-tags': ['automation', 'chatgpt', 'marketing'],
  'transformation-type': 'financial',
  'transformation-clarity': 4,
  'demand-priority': 'demand-first',
  'income-target': 'scale',
  'income-levers': ['group', 'products', 'highticket', 'audience'],
  'lifestyle-shape': ['scalable', 'remote'],
  'audience-who': 'businesses',
  'audience-channels': ['linkedin', 'newsletter'],
  'model-delivery': ['group', 'course'],
  'model-readiness': 4,
};

describe('CoachX intelligence engine', () => {
  const result = analyze(seedQuestions, businessAnswers, { uid: 'test' });

  it('returns a top-5 ranked recommendation set', () => {
    expect(result.recommendations.length).toBe(5);
    for (let i = 1; i < result.recommendations.length; i++) {
      expect(result.recommendations[i - 1].nicheScore).toBeGreaterThanOrEqual(result.recommendations[i].nicheScore);
    }
  });

  it('produces the full 24-field intelligence for the top niche', () => {
    const t = result.recommendations[0];
    for (const n of [t.nicheScore, t.confidenceScore, t.profitabilityScore, t.passionScore, t.skillMatch, t.demandScore, t.competitionScore, t.difficultyScore]) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
    }
    expect(t.contentPillars.length).toBeGreaterThan(0);
    expect(t.actionPlan90Day.length).toBe(3);
    expect(t.growthRoadmap.length).toBe(4);
    expect(t.revenuePotential.high).toBeGreaterThan(t.revenuePotential.low);
  });

  it('surfaces a business/tech niche for business-oriented answers', () => {
    const topCats = result.recommendations.slice(0, 3).map((r) => r.categoryId);
    expect(topCats.some((c) => c === 'business' || c === 'tech' || c === 'money')).toBe(true);
  });

  it('builds a 10-dimension profile', () => {
    expect(Object.keys(result.profile).length).toBe(10);
    expect(result.profile.passion).toBeGreaterThan(0);
  });

  it('flags weak input when nothing is answered', () => {
    const weak = analyze(seedQuestions, {});
    expect(weak.meta.weak).toBe(true);
  });
});

describe('explainability & tunable weights', () => {
  const base = analyze(seedQuestions, businessAnswers, { uid: 'test' });

  it('exposes a score breakdown whose contributions are value×weight', () => {
    const t = base.recommendations[0];
    expect(t.scoreBreakdown.length).toBeGreaterThan(0);
    for (const b of t.scoreBreakdown) {
      expect(b.contribution).toBe(Math.round(b.value * b.weight));
    }
  });

  it('changes the score when weights change', () => {
    const demandHeavy = analyze(seedQuestions, businessAnswers, {
      weights: { match: 0.1, passion: 0.1, skill: 0.1, profitability: 0.1, demand: 0.5, competition: 0.1, difficultyPenalty: 0.1 },
    });
    expect(demandHeavy.recommendations[0].nicheScore).not.toBe(base.recommendations[0].nicheScore);
  });
});

describe('conditional branching', () => {
  it('hides the income-levers ranking unless a high income goal is chosen', () => {
    const lever = seedQuestions.find((q) => q.id === 'income-levers')!;
    expect(isVisible(lever, { 'income-target': 'side' })).toBe(false);
    expect(isVisible(lever, { 'income-target': 'scale' })).toBe(true);
  });

  it('excludes hidden questions from the visible set', () => {
    const vis = visibleQuestions(seedQuestions, { 'income-target': 'side' });
    expect(vis.find((q) => q.id === 'income-levers')).toBeUndefined();
  });
});
