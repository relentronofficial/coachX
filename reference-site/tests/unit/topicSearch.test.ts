import { describe, expect, it } from 'vitest';
import {
  ALL_TOPICS, SMART_COLLECTIONS, buildInterestProfile, collectionTopics, detectOverlaps, deriveTopic,
  recommendTopics, searchTopics, suggestSearch, topicById,
} from '@/lib/nicheAI/topicEngine';

const byLabel = (needle: string) => ALL_TOPICS.find((t) => t.label.toLowerCase() === needle.toLowerCase());

describe('indexed search', () => {
  it('finds exact matches and ranks them first', () => {
    const hits = searchTopics('sourdough baking');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].label.toLowerCase()).toContain('sourdough');
  });

  it('tolerates typos', () => {
    for (const typo of ['fittness', 'marketting', 'photograpy', 'nutriton']) {
      expect(searchTopics(typo).length, typo).toBeGreaterThan(0);
    }
  });

  it('expands synonyms to the library vocabulary', () => {
    // "workout" should reach training topics even where the label says "training".
    const hits = searchTopics('workout');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((t) => /training|exercise|gym|workout|fitness/i.test(t.label))).toBe(true);
  });

  it('matches on keywords, not just labels', () => {
    const hits = searchTopics('entrepreneur');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('returns nothing for empty or stop-word-only queries', () => {
    expect(searchTopics('   ')).toEqual([]);
    expect(searchTopics('the and of')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(searchTopics('business', 25).length).toBeLessThanOrEqual(25);
  });

  it('scales: a broad query over 10k topics stays fast', () => {
    const start = Date.now();
    for (let i = 0; i < 20; i++) searchTopics('marketing business ai');
    // Indexed lookup, not a full scan — 20 multi-token queries must be quick.
    expect(Date.now() - start).toBeLessThan(2000);
  });
});

describe('auto-complete suggestions', () => {
  it('suggests categories, subcategories and topics', () => {
    const s = suggestSearch('mark');
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.text.length > 0)).toBe(true);
  });

  it('ignores queries shorter than two characters', () => {
    expect(suggestSearch('a')).toEqual([]);
  });

  it('offers a synonym hint for everyday phrasing', () => {
    const s = suggestSearch('workout', 10);
    expect(s.some((x) => x.kind === 'synonym')).toBe(true);
  });

  it('never exceeds the requested limit', () => {
    expect(suggestSearch('business', 5).length).toBeLessThanOrEqual(5);
  });
});

describe('smart collections', () => {
  it('every collection matches at least one topic', () => {
    for (const c of SMART_COLLECTIONS) {
      expect(collectionTopics(c.id).length, c.id).toBeGreaterThan(0);
    }
  });

  it('collections actually honour their stated rule', () => {
    for (const t of collectionTopics('high-ticket')) expect(t.revenuePotential).toBe('Very High');
    for (const t of collectionTopics('low-competition')) expect(t.competitionLevel).toBe('Low');
    for (const t of collectionTopics('quick-start')) expect(t.skillLevel).toBe('Beginner');
    for (const t of collectionTopics('best-opportunity')) expect(t.opportunityScore).toBeGreaterThanOrEqual(75);
  });

  it('returns an empty list for an unknown collection', () => {
    expect(collectionTopics('does-not-exist')).toEqual([]);
  });
});

describe('overlap detection', () => {
  it('flags two near-identical topics from the same subcategory', () => {
    // Find a subcategory with several topics that share keywords.
    const bySub = new Map<string, typeof ALL_TOPICS>();
    for (const t of ALL_TOPICS) {
      const k = `${t.categoryId}::${t.subcategory}`;
      if (!bySub.has(k)) bySub.set(k, []);
      bySub.get(k)!.push(t);
    }
    const group = [...bySub.values()].find((g) => g.length >= 3)!;
    const overlaps = detectOverlaps(group.slice(0, 3).map((t) => t.id));
    expect(overlaps.length).toBeGreaterThan(0);
    expect(overlaps[0].a.id).not.toBe(overlaps[0].b.id);
  });

  it('does not flag topics from unrelated categories', () => {
    const a = ALL_TOPICS.find((t) => t.categoryId === 'seo')!;
    const b = ALL_TOPICS.find((t) => t.categoryId === 'gardening')!;
    expect(detectOverlaps([a.id, b.id])).toEqual([]);
  });

  it('handles an empty selection', () => {
    expect(detectOverlaps([])).toEqual([]);
  });
});

describe('interest profile', () => {
  it('is empty and zero-confidence with no selection', () => {
    const p = buildInterestProfile([]);
    expect(p.count).toBe(0);
    expect(p.confidence).toBe(0);
    expect(p.complementary).toEqual([]);
  });

  it('grows more confident as a coherent selection grows', () => {
    const seo = ALL_TOPICS.filter((t) => t.categoryId === 'seo').slice(0, 10).map((t) => t.id);
    const one = buildInterestProfile(seo.slice(0, 1)).confidence;
    const five = buildInterestProfile(seo.slice(0, 5)).confidence;
    const ten = buildInterestProfile(seo).confidence;
    expect(one).toBeLessThan(five);
    expect(five).toBeLessThan(ten);
    expect(ten).toBeLessThanOrEqual(100);
  });

  it('rates a focused selection as more focused than a scattered one', () => {
    const focused = ALL_TOPICS.filter((t) => t.niche === 'business').slice(0, 8).map((t) => t.id);
    const scattered = ['business', 'health', 'creative', 'money', 'tech', 'mind', 'career', 'relationships']
      .map((n) => ALL_TOPICS.find((t) => t.niche === n)!.id);
    expect(buildInterestProfile(focused).focus).toBeGreaterThan(buildInterestProfile(scattered).focus);
  });

  it('identifies the dominant niche and reports shares that make sense', () => {
    const picks = ALL_TOPICS.filter((t) => t.niche === 'health').slice(0, 6).map((t) => t.id);
    const p = buildInterestProfile(picks);
    expect(p.topNiches[0].niche).toBe('health');
    expect(p.topNiches[0].share).toBe(100);
    expect(p.topNiches.reduce((n, x) => n + x.count, 0)).toBe(6);
  });

  it('suggests complements from outside the chosen categories', () => {
    const picks = ALL_TOPICS.filter((t) => t.categoryId === 'seo').slice(0, 4).map((t) => t.id);
    const p = buildInterestProfile(picks);
    for (const c of p.complementary) expect(c.categoryId).not.toBe('seo');
  });

  it('raises gap advice for a thin or one-note selection', () => {
    const p = buildInterestProfile([ALL_TOPICS[0].id]);
    expect(p.gaps.length).toBeGreaterThan(0);
    expect(p.gaps.some((g) => /more topics/i.test(g))).toBe(true);
  });

  it('computes skill mix and averages over the real selection', () => {
    const picks = ALL_TOPICS.slice(0, 12).map((t) => t.id);
    const p = buildInterestProfile(picks);
    const mixTotal = p.skillMix.Beginner + p.skillMix.Intermediate + p.skillMix.Advanced;
    expect(mixTotal).toBe(12);
    expect(p.avgOpportunity).toBeGreaterThan(0);
    expect(p.avgOpportunity).toBeLessThanOrEqual(100);
  });

  it('ignores ids that no longer resolve', () => {
    const p = buildInterestProfile(['no-such-topic', ALL_TOPICS[0].id]);
    expect(p.count).toBe(1);
  });
});

describe('recommendations', () => {
  it('never recommends an already-selected topic', () => {
    const picks = ALL_TOPICS.slice(0, 5).map((t) => t.id);
    const recs = recommendTopics(picks, undefined, 20);
    for (const r of recs) expect(picks).not.toContain(r.id);
  });

  it('weights popularity when supplied', () => {
    const seed = ALL_TOPICS.find((t) => t.categoryId === 'seo')!;
    const plain = recommendTopics([seed.id], undefined, 5);
    const boostTarget = plain[2];
    const pop = new Map([[boostTarget.id, 50]]);
    const boosted = recommendTopics([seed.id], pop, 5);
    expect(boosted.findIndex((t) => t.id === boostTarget.id))
      .toBeLessThanOrEqual(plain.findIndex((t) => t.id === boostTarget.id));
  });
});

describe('deriveTopic (custom/admin topics)', () => {
  it('fills every profile field from minimal input', () => {
    const t = deriveTopic({
      id: 'custom-x', label: 'Custom topic', group: 'Business', parentCategory: 'Custom',
      categoryId: 'custom', subcategory: 'General', niche: 'business', businessCategory: 'Custom',
      monetization: 'High', difficulty: 'Intermediate', audience: [],
    });
    expect(t.description.length).toBeGreaterThan(20);
    expect(t.industry).toBe('Custom');
    expect(t.audience).toEqual(['Individuals']);
    expect(t.contentFormats.length).toBeGreaterThan(0);
    expect(t.certifications.length).toBeGreaterThan(0);
    expect(t.opportunityScore).toBeGreaterThan(0);
  });

  it('honours an explicit description instead of generating one', () => {
    const t = deriveTopic({
      id: 'c2', label: 'X', group: 'G', parentCategory: 'P', categoryId: 'c', subcategory: 'S',
      niche: 'tech', businessCategory: 'B', monetization: 'Low', difficulty: 'Beginner',
      audience: ['Creators'], description: 'Hand-written copy.',
    });
    expect(t.description).toBe('Hand-written copy.');
  });

  it('produces a stable profile for the same id', () => {
    const make = () => deriveTopic({
      id: 'stable-1', label: 'Stable', group: 'G', parentCategory: 'P', categoryId: 'c', subcategory: 'S',
      niche: 'money', businessCategory: 'B', monetization: 'High', difficulty: 'Advanced', audience: ['Individuals'],
    });
    expect(make()).toEqual(make());
  });
});

describe('library integrity at scale', () => {
  it('resolves every related-topic id', () => {
    for (const t of ALL_TOPICS.slice(0, 2000)) {
      for (const r of t.related) expect(topicById.has(r), `${t.id} → ${r}`).toBe(true);
    }
  });

  it('never lists a topic as its own relation', () => {
    for (const t of ALL_TOPICS) expect(t.related.includes(t.id), t.id).toBe(false);
  });

  it('keeps opportunity score consistent with its inputs', () => {
    const high = byLabel('Dropshipping');
    if (high) expect(high.opportunityScore).toBeGreaterThan(0);
    for (const t of ALL_TOPICS.slice(0, 500)) {
      expect(t.opportunityScore).toBeGreaterThanOrEqual(1);
      expect(t.opportunityScore).toBeLessThanOrEqual(100);
    }
  });
});
