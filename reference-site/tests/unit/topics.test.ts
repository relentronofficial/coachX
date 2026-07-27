import { describe, expect, it } from 'vitest';
import { LIBRARY } from '@/lib/nicheAI/topicLibrary';
import {
  ALL_TOPICS, ALPHABET, BY_LETTER, CATEGORIES, CATEGORY_COUNT, NAV, SUBCATEGORY_COUNT, TOPIC_COUNT,
  recommendTopics, searchTopics, similarTopics, topicById, topicLetter,
} from '@/lib/nicheAI/topicEngine';
import { topicOptions } from '@/lib/nicheAI/topics';

describe('topic taxonomy', () => {
  it('meets the enterprise size targets', () => {
    expect(TOPIC_COUNT).toBeGreaterThanOrEqual(10_000);
    expect(CATEGORY_COUNT).toBeGreaterThanOrEqual(200);
    expect(SUBCATEGORY_COUNT).toBeGreaterThanOrEqual(800);
  });

  it('gives every topic all 21 profile fields', () => {
    const LEVELS = ['Low', 'Medium', 'High', 'Very High'];
    const SKILLS = ['Beginner', 'Intermediate', 'Advanced'];
    for (const t of ALL_TOPICS) {
      // Taxonomy
      expect(t.parentCategory, t.id).toBeTruthy();
      expect(t.subcategory, t.id).toBeTruthy();
      expect(t.description.length, t.id).toBeGreaterThan(30);
      expect(Array.isArray(t.related), t.id).toBe(true);
      expect(t.aiTags.length, t.id).toBeGreaterThan(0);
      expect(t.keywords.length, t.id).toBeGreaterThan(0);
      // Levels
      expect(SKILLS, t.id).toContain(t.skillLevel);
      expect(t.skillLevel, t.id).toBe(t.difficulty); // alias stays in sync
      expect(t.experienceLevel, t.id).toBeTruthy();
      expect(t.audience.length, t.id).toBeGreaterThan(0);
      // Mappings
      expect(t.coachingType, t.id).toBeTruthy();
      expect(t.industry, t.id).toBeTruthy();
      expect(t.businessCategory, t.id).toBeTruthy();
      // Market
      expect(LEVELS, t.id).toContain(t.revenuePotential);
      expect(t.revenueBand, t.id).toMatch(/₹/);
      expect(LEVELS, t.id).toContain(t.marketDemand);
      expect(LEVELS, t.id).toContain(t.competitionLevel);
      expect(t.opportunityScore, t.id).toBeGreaterThanOrEqual(1);
      expect(t.opportunityScore, t.id).toBeLessThanOrEqual(100);
      // Monetisation mappings
      expect(t.contentFormats.length, t.id).toBeGreaterThan(0);
      expect(t.offerTypes.length, t.id).toBeGreaterThan(0);
      expect(t.digitalProducts.length, t.id).toBeGreaterThan(0);
      expect(t.services.length, t.id).toBeGreaterThan(0);
      expect(t.communityFormats.length, t.id).toBeGreaterThan(0);
      expect(t.certifications.length, t.id).toBeGreaterThan(0);
    }
  });

  it('writes descriptions that vary rather than repeating one template', () => {
    const sample = ALL_TOPICS.slice(0, 500).map((t) => t.description);
    // Descriptions are templated but must not collapse to a single shape.
    const shapes = new Set(sample.map((d) => d.slice(0, 24)));
    expect(shapes.size).toBeGreaterThan(50);
    expect(new Set(sample).size).toBeGreaterThan(450);
  });

  it('has unique topic and category ids', () => {
    expect(new Set(ALL_TOPICS.map((t) => t.id)).size).toBe(TOPIC_COUNT);
    expect(new Set(LIBRARY.map((c) => c.id)).size).toBe(LIBRARY.length);
  });

  it('keeps every category reachable from the nav tree', () => {
    const navIds = new Set(NAV.flatMap((g) => g.categories.map((c) => c.id)));
    for (const t of ALL_TOPICS) expect(navIds.has(t.categoryId), t.categoryId).toBe(true);
    expect(CATEGORIES.length).toBe(CATEGORY_COUNT);
  });

  it('reports nav counts that match the underlying topics', () => {
    const perCat = new Map<string, number>();
    for (const t of ALL_TOPICS) perCat.set(t.categoryId, (perCat.get(t.categoryId) ?? 0) + 1);
    for (const g of NAV) {
      expect(g.count).toBe(g.categories.reduce((n, c) => n + c.count, 0));
      for (const c of g.categories) {
        expect(c.count, c.id).toBe(perCat.get(c.id));
        expect(c.count, c.id).toBe(c.subs.reduce((n, s) => n + s.count, 0));
      }
    }
  });

  /**
   * Topic ids are derived from category id + subcategory name + label, and
   * saved assessments/favourites store those ids. Renaming any of the three
   * would silently orphan stored selections, so a sample is pinned here.
   */
  it('keeps historical topic ids stable', () => {
    const frozen = [
      'business-foundations-getting-started-starting-a-business',
      'fitness-training-weight-loss',
      'cooking-cooking-home-cooking',
      'relationships-dating-online-dating',
      'personal-development-self-confidence-building',
    ];
    for (const id of frozen) expect(topicById.get(id), id).toBeTruthy();
  });

  it('applies subcategory-level metadata overrides', () => {
    // Fat Loss lives under Fitness (High) but monetizes Very High in its own right.
    const fatLoss = ALL_TOPICS.filter((t) => t.categoryId === 'fitness' && t.subcategory === 'Fat Loss');
    expect(fatLoss.length).toBeGreaterThan(0);
    for (const t of fatLoss) {
      expect(t.monetization).toBe('Very High');
      expect(t.businessCategory).toBe('Weight Loss');
    }
    // A sibling subcategory keeps the parent category's mapping.
    const training = ALL_TOPICS.filter((t) => t.categoryId === 'fitness' && t.subcategory === 'Training');
    expect(training.every((t) => t.businessCategory === 'Fitness Coaching')).toBe(true);
  });

  it('stays in sync with the scoring options the question bank consumes', () => {
    expect(topicOptions.length).toBe(TOPIC_COUNT);
    expect(topicOptions.every((o) => o.value && o.label)).toBe(true);
  });
});

describe('topic search & discovery', () => {
  it('tolerates typos', () => {
    const hits = searchTopics('fittness');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((t) => /fitness/i.test(t.label) || t.keywords.includes('fitness'))).toBe(true);
  });

  it('ranks exact label matches above fuzzy ones', () => {
    const hits = searchTopics('meditation');
    expect(hits[0].label.toLowerCase()).toContain('meditation');
  });

  it('returns nothing for an empty query', () => {
    expect(searchTopics('   ')).toEqual([]);
  });

  it('indexes every topic under a valid letter', () => {
    const total = [...BY_LETTER.values()].reduce((n, ids) => n + ids.length, 0);
    expect(total).toBe(TOPIC_COUNT);
    for (const l of BY_LETTER.keys()) expect(ALPHABET).toContain(l);
    expect(topicLetter('Zero-waste living')).toBe('Z');
    expect(topicLetter('30-minute dinners')).toBe('#');
  });

  it('recommends unselected topics related to the selection', () => {
    const seed = ALL_TOPICS.find((t) => t.categoryId === 'seo')!;
    const recs = recommendTopics([seed.id], undefined, 10);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.id === seed.id)).toBe(false);
  });

  it('detects similar topics for duplicate warnings', () => {
    const seed = ALL_TOPICS.find((t) => t.related.length > 0)!;
    const sims = similarTopics(seed.id, 5);
    expect(sims.every((s) => s.id !== seed.id)).toBe(true);
    expect(sims.every((s) => s.categoryId === seed.categoryId)).toBe(true);
  });

  it('recommends nothing from an empty selection', () => {
    expect(recommendTopics([], undefined, 5)).toEqual([]);
  });
});
