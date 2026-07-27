import { describe, it, expect } from 'vitest';
import {
  RAILS,
  affinityScore,
  highlightParts,
  iconForCategory,
  iconForGroup,
  railTopics,
} from '@/lib/nicheAI/discovery';
import { ALL_TOPICS, POPULAR_SEED, type EnrichedTopic } from '@/lib/nicheAI/topicEngine';

const text = (parts: { text: string }[]) => parts.map((p) => p.text).join('');
const hits = (parts: { text: string; hit: boolean }[]) => parts.filter((p) => p.hit).map((p) => p.text);

describe('highlightParts', () => {
  it('returns the whole string untouched when there is no query', () => {
    expect(highlightParts('Fitness Coach', '')).toEqual([{ text: 'Fitness Coach', hit: false }]);
  });

  it('never loses or duplicates characters', () => {
    const src = 'Executive Coaching for Fitness Coaches';
    for (const q of ['coach', 'fitness coach', 'x', 'executive fitness', '']) {
      expect(text(highlightParts(src, q))).toBe(src);
    }
  });

  it('matches case-insensitively but preserves the original casing', () => {
    expect(hits(highlightParts('Fitness Coach', 'fitness'))).toEqual(['Fitness']);
  });

  it('highlights every token of a multi-word query', () => {
    expect(hits(highlightParts('Fitness Coach Business', 'business fitness'))).toEqual(['Fitness', 'Business']);
  });

  it('merges overlapping matches instead of nesting them', () => {
    const parts = highlightParts('coaching', 'coach coaching');
    expect(hits(parts)).toEqual(['coaching']);
    expect(text(parts)).toBe('coaching');
  });

  it('ignores single-character noise', () => {
    expect(highlightParts('Fitness Coach', 'a')).toEqual([{ text: 'Fitness Coach', hit: false }]);
  });

  it('is not confused by regex metacharacters in the query', () => {
    expect(() => highlightParts('C++ for beginners', 'c++')).not.toThrow();
    expect(text(highlightParts('C++ for beginners', 'c++'))).toBe('C++ for beginners');
  });
});

describe('category icons', () => {
  it('resolves an icon for every category in the live taxonomy', () => {
    const names = Array.from(new Set(ALL_TOPICS.map((t) => `${t.parentCategory}|${t.group}`)));
    for (const key of names) {
      const [name, group] = key.split('|');
      expect(iconForCategory(name, group), name).toBeTruthy();
    }
  });

  it('prefers a keyword rule over the group fallback', () => {
    expect(iconForCategory('Crypto & Web3', 'Money & Finance')).toBe('⛓');
    expect(iconForCategory('Yoga & Mind-Body', 'Health & Fitness')).toBe('🧘');
  });

  it('falls back to the group, then to a globe', () => {
    expect(iconForCategory('Zzz Unmatched', 'Health & Fitness')).toBe(iconForGroup('Health & Fitness'));
    expect(iconForCategory('Zzz Unmatched', 'No Such Group')).toBe('🌐');
  });
});

describe('affinityScore', () => {
  const pick = (id: string) => ALL_TOPICS.find((t) => t.id === id)!;
  const first = ALL_TOPICS[0];

  it('is undefined with nothing selected — a match against no profile is meaningless', () => {
    expect(affinityScore(first, [])).toBeUndefined();
  });

  it('scores a topic against itself at the top of the range', () => {
    expect(affinityScore(first, [first])!).toBeGreaterThanOrEqual(70);
  });

  it('stays within 0..100', () => {
    const sample = ALL_TOPICS.slice(0, 200);
    const selected = [pick(ALL_TOPICS[0].id), pick(ALL_TOPICS[50].id)];
    for (const t of sample) {
      const s = affinityScore(t, selected)!;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it('rates a same-niche topic above an unrelated one', () => {
    const anchor = ALL_TOPICS.find((t) => t.niche === 'business')!;
    const same = ALL_TOPICS.find((t) => t.niche === 'business' && t.id !== anchor.id)!;
    const other = ALL_TOPICS.find((t) => t.niche === 'creative')!;
    expect(affinityScore(same, [anchor])!).toBeGreaterThan(affinityScore(other, [anchor])!);
  });
});

describe('discovery rails', () => {
  it('covers every requested section', () => {
    expect(RAILS.map((r) => r.id)).toEqual([
      'recommended',
      'trending',
      'fast-growing',
      'high-income',
      'beginner',
      'most-selected',
    ]);
  });

  it('rule-based rails return topics that actually satisfy the rule', () => {
    const high = railTopics('high-income', ALL_TOPICS, {}, 10);
    expect(high.length).toBeGreaterThan(0);
    for (const t of high) expect(t.revenuePotential).toBe('Very High');

    const beginner = railTopics('beginner', ALL_TOPICS, {}, 10);
    expect(beginner.length).toBeGreaterThan(0);
    for (const t of beginner) expect(t.skillLevel).toBe('Beginner');

    const fast = railTopics('fast-growing', ALL_TOPICS, {}, 10);
    expect(fast.length).toBeGreaterThan(0);
    for (const t of fast) {
      expect(t.marketDemand).toBe('Very High');
      expect(t.opportunityScore).toBeGreaterThanOrEqual(70);
    }
  });

  it('respects the limit', () => {
    expect(railTopics('high-income', ALL_TOPICS, {}, 5)).toHaveLength(5);
  });

  it('recommended passes the engine result straight through', () => {
    const recommended = ALL_TOPICS.slice(0, 3);
    expect(railTopics('recommended', ALL_TOPICS, { recommended }, 12)).toEqual(recommended);
    expect(railTopics('recommended', ALL_TOPICS, {}, 12)).toEqual([]);
  });

  it('most-selected ranks by learned counts, falling back to the popular seed', () => {
    const target = ALL_TOPICS[7];
    const ranked = railTopics('most-selected', ALL_TOPICS, { popularity: new Map([[target.id, 99]]) }, 5);
    expect(ranked[0].id).toBe(target.id);

    // With no learned counts at all the rail must still be populated.
    const seeded = railTopics('most-selected', ALL_TOPICS, {}, 5);
    expect(seeded.length).toBeGreaterThan(0);
    for (const t of seeded) expect(POPULAR_SEED.has(t.id)).toBe(true);
  });

  it('never returns a disabled topic — it filters the pool it is given', () => {
    const pool: EnrichedTopic[] = ALL_TOPICS.filter((t) => t.revenuePotential === 'Very High').slice(0, 20);
    const banned = new Set([pool[0].id]);
    const out = railTopics('high-income', pool.filter((t) => !banned.has(t.id)), {}, 20);
    expect(out.some((t) => banned.has(t.id))).toBe(false);
  });
});
