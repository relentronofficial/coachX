import { describe, it, expect } from 'vitest';
import { engineTools } from '@/lib/tools/configs';
import { clarityAdvice, scoredAreas } from '@/lib/tools/engine';
import { personalCodex } from '@/lib/tools/configs/personalCodex';
import { skillsStrengthScorecard } from '@/lib/tools/configs/skillsStrengthScorecard';
import { freedomBusinessCodex } from '@/lib/tools/configs/freedomBusinessCodex';
import { viralReelsChallenge } from '@/lib/tools/configs/viralReelsChallenge';
import type { Answers } from '@/lib/tools/types';

/** Pick the first option of every step to build a valid answer set. */
function firstAnswers(steps: (typeof engineTools)[number]['steps']): Answers {
  const a: Answers = {};
  for (const s of steps) {
    if (s.type === 'single' && s.options) a[s.id] = s.options[0].value;
    else if (s.type === 'multi' && s.options) a[s.id] = [s.options[0].value];
    else if (s.type === 'scale' && s.scale) a[s.id] = s.scale.max;
    else if (s.type === 'text') a[s.id] = 'sample';
  }
  return a;
}

describe('registry', () => {
  it('exposes all six engine tools with unique slugs', () => {
    expect(engineTools).toHaveLength(6);
    const slugs = engineTools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(6);
    expect(slugs).toEqual(
      expect.arrayContaining([
        'personal-codex',
        'coach-persona-codex',
        'freedom-business-codex',
        'skills-strength-scorecard',
        'viral-reels-challenge',
        'youtube-domination',
      ]),
    );
  });

  it('every tool scores a valid answer set without throwing', () => {
    for (const tool of engineTools) {
      const result = tool.score(firstAnswers(tool.steps));
      expect(result.kind).toBeTruthy();
    }
  });
});

describe('clarity recommendation across all six tools', () => {
  it('every tool exposes scored areas the advice can read', () => {
    for (const tool of engineTools) {
      const areas = scoredAreas(tool.score(firstAnswers(tool.steps)));
      expect(areas.length, tool.slug).toBeGreaterThan(0);
      for (const a of areas) {
        expect(a.label, tool.slug).toBeTruthy();
        expect(a.score, `${tool.slug} · ${a.label}`).toBeGreaterThanOrEqual(0);
        expect(a.score, `${tool.slug} · ${a.label}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('an empty answer set triggers the critical (0%) card on every tool', () => {
    for (const tool of engineTools) {
      const advice = clarityAdvice(tool.score({}));
      expect(advice, tool.slug).not.toBeNull();
      expect(advice!.severity, tool.slug).toBe('critical');
      expect(advice!.zeroAreas.length, tool.slug).toBeGreaterThan(0);
    }
  });

  it('a fully-strong scorecard shows no card at all', () => {
    const max: Answers = {};
    for (const s of skillsStrengthScorecard.steps) if (s.scale) max[s.id] = s.scale.max;
    expect(clarityAdvice(skillsStrengthScorecard.score(max))).toBeNull();
  });
});

describe('personalCodex', () => {
  it('returns a persona and picks the dominant dimension', () => {
    // Choose the "builder" option (first) on every question.
    const res = personalCodex.score(firstAnswers(personalCodex.steps));
    expect(res.kind).toBe('persona');
    if (res.kind === 'persona') {
      expect(res.title).toBe('The Builder');
      expect(res.traits.find((t) => t.label === 'The Builder')!.value).toBeGreaterThan(0);
    }
  });
});

describe('skillsStrengthScorecard', () => {
  it('max answers → high overall and Scaling level', () => {
    const res = skillsStrengthScorecard.score(firstAnswers(skillsStrengthScorecard.steps));
    expect(res.kind).toBe('scorecard');
    if (res.kind === 'scorecard') {
      expect(res.overall).toBe(100);
      expect(res.level).toBe('Scaling');
      expect(res.dimensions).toHaveLength(5);
    }
  });

  it('minimum answers → low overall and Starting level', () => {
    const min: Answers = {};
    for (const s of skillsStrengthScorecard.steps) if (s.scale) min[s.id] = s.scale.min;
    const res = skillsStrengthScorecard.score(min);
    if (res.kind === 'scorecard') {
      expect(res.overall).toBe(0);
      expect(res.level).toBe('Starting');
    }
  });
});

describe('freedomBusinessCodex', () => {
  it('returns a blueprint with four pillars', () => {
    const res = freedomBusinessCodex.score(firstAnswers(freedomBusinessCodex.steps));
    expect(res.kind).toBe('blueprint');
    if (res.kind === 'blueprint') {
      expect(res.pillars).toHaveLength(4);
      expect(res.actions.length).toBeGreaterThan(0);
    }
  });
});

describe('viralReelsChallenge', () => {
  it('counts completed tasks and reaches 100% when all checked', () => {
    const all: Answers = {};
    for (const s of viralReelsChallenge.steps) all[s.id] = (s.options ?? []).map((o) => o.value);
    const res = viralReelsChallenge.score(all);
    expect(res.kind).toBe('challenge');
    if (res.kind === 'challenge') {
      expect(res.percent).toBe(100);
      expect(res.completed).toBe(res.total);
      expect(res.level).toBe('Challenge Complete');
    }
  });

  it('partial completion reports in-progress', () => {
    const partial: Answers = { day1: ['d1a'] };
    const res = viralReelsChallenge.score(partial);
    if (res.kind === 'challenge') {
      expect(res.completed).toBe(1);
      expect(res.percent).toBeLessThan(100);
    }
  });
});
