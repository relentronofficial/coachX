/**
 * Topic engine — expands the raw library into fully-enriched, indexed topics.
 *
 * Produces 1,500+ unique topics, each with: parent category, subcategory,
 * keywords, related topics, AI tags, difficulty, audience, monetization,
 * coaching-niche mapping and business-category mapping. Also builds fast,
 * memoized indexes for the explorer UI: grouped navigation, filter facets,
 * typo-tolerant indexed search, and topic recommendations.
 *
 * Everything is computed once at module load and cached (client-side caching).
 */

import { LIBRARY, type Audience, type Difficulty, type ExperienceLevel, type Level, type Monetization, type NicheCat } from './topicLibrary';
import type { QuestionOption } from './types';

export type { Audience, Difficulty, ExperienceLevel, Level, Monetization, NicheCat };

/**
 * The full topic model. The first block is the identity/taxonomy; everything
 * after `description` is enrichment derived deterministically from the
 * category's editorial signals, so the raw library stays compact and every
 * topic is guaranteed to carry a complete, consistent profile.
 */
export interface EnrichedTopic {
  id: string;
  label: string;
  group: string; // top-level group
  parentCategory: string;
  categoryId: string;
  subcategory: string;
  description: string;
  niche: NicheCat; // coaching niche mapping (drives scoring)
  coachingType: string; // human-readable niche label
  industry: string;
  businessCategory: string; // business-model mapping
  keywords: string[]; // search keywords
  aiTags: string[];
  difficulty: Difficulty; // a.k.a. skill level
  skillLevel: Difficulty;
  experienceLevel: ExperienceLevel;
  audience: Audience[];
  monetization: Monetization;
  revenuePotential: Monetization;
  revenueBand: string;
  marketDemand: Level;
  competitionLevel: Level;
  opportunityScore: number; // 0–100, demand vs competition vs revenue
  contentFormats: string[];
  offerTypes: string[];
  digitalProducts: string[];
  services: string[];
  communityFormats: string[];
  certifications: string[];
  related: string[]; // related topic ids
  searchTokens: string[];
}

const NICHE_LABEL: Record<NicheCat, string> = {
  health: 'Health & Wellness', mind: 'Mind & Growth', relationships: 'Relationships', money: 'Money & Wealth',
  career: 'Career', business: 'Business', tech: 'Technology', creative: 'Creative',
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const STOP = new Set(['for', 'the', 'and', 'a', 'to', 'of', 'in', 'on', 'with', 'your', 'you', 'at', 'no', 'without']);
function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
}

// Deterministic difficulty distribution (varied across the library, but honest
// about explicit "beginner"/"advanced" modifiers).
function difficultyFor(label: string, i: number): Difficulty {
  const l = label.toLowerCase();
  if (/beginner|basics|getting started|101|for new/.test(l)) return 'Beginner';
  if (/advanced|master|expert|scaling|pro\b/.test(l)) return 'Advanced';
  return (['Beginner', 'Intermediate', 'Advanced', 'Intermediate'] as Difficulty[])[i % 4];
}

// ---- Derivation tables ----------------------------------------------------
// Every enrichment field below is a pure function of the category's editorial
// signals plus the topic label, so the model stays consistent across ~10k
// topics without hand-authoring 21 fields each.

const LEVELS: Level[] = ['Low', 'Medium', 'High', 'Very High'];
const levelIndex = (l: Level) => LEVELS.indexOf(l);

/** Stable pseudo-random in [0,1) from a string — keeps variety reproducible. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const DEMAND_BY_NICHE: Record<NicheCat, Level> = {
  business: 'High', money: 'High', tech: 'Very High', career: 'High',
  health: 'Very High', mind: 'High', relationships: 'Medium', creative: 'Medium',
};

// INR bands, derived from the editorial USD model at the `USD_TO_INR` rate in
// `lib/currency.ts` and rounded to readable lakh figures.
const REVENUE_BAND: Record<Monetization, string> = {
  Low: '₹0–80,000 / mo', Medium: '₹80,000–₹4 L / mo', High: '₹4 L–₹16 L / mo', 'Very High': '₹16 L+ / mo',
};

const CONTENT_FORMATS: Record<NicheCat, string[]> = {
  business: ['Case studies', 'Frameworks & templates', 'Webinars', 'Newsletters', 'LinkedIn posts'],
  money: ['Explainers', 'Calculators & spreadsheets', 'Long-form video', 'Newsletters', 'Charts & breakdowns'],
  tech: ['Tutorials', 'Code walkthroughs', 'Documentation', 'Live builds', 'Comparison guides'],
  career: ['Checklists', 'Templates', 'Interview breakdowns', 'Short-form video', 'Cohort workshops'],
  health: ['Demo video', 'Programs & plans', 'Progress stories', 'Short-form video', 'Podcasts'],
  mind: ['Essays', 'Guided audio', 'Journal prompts', 'Podcasts', 'Short-form video'],
  relationships: ['Scripts & scenarios', 'Story-led video', 'Q&A sessions', 'Worksheets', 'Podcasts'],
  creative: ['Behind-the-scenes', 'Process video', 'Portfolio pieces', 'Carousels', 'Livestreams'],
};

const OFFER_TYPES: Record<Monetization, string[]> = {
  Low: ['Low-ticket digital product', 'Affiliate content', 'Ad-supported content', 'Tip jar / donations'],
  Medium: ['Paid course', 'Group program', 'Paid newsletter', 'Workshops'],
  High: ['Signature course', 'Group coaching', 'Membership', '1:1 coaching', 'Workshops'],
  'Very High': ['High-ticket coaching', 'Done-for-you services', 'Mastermind', 'Consulting retainer', 'Licensing'],
};

const DIGITAL_PRODUCTS: Record<NicheCat, string[]> = {
  business: ['SOP library', 'Notion templates', 'Pitch deck kit', 'Financial model'],
  money: ['Budget spreadsheet', 'Investment tracker', 'Tax checklist', 'Calculator tool'],
  tech: ['Code starter kit', 'Component library', 'API cheatsheet', 'Project templates'],
  career: ['Resume templates', 'Interview question bank', 'Portfolio kit', '90-day plan'],
  health: ['Meal plan', 'Workout program', 'Habit tracker', 'Progress journal'],
  mind: ['Guided audio pack', 'Workbook', 'Journal prompt deck', 'Meditation series'],
  relationships: ['Conversation scripts', 'Date-night deck', 'Workbook', 'Assessment quiz'],
  creative: ['Preset & asset pack', 'Brush / LUT bundle', 'Template pack', 'Swipe file'],
};

const SERVICES: Record<NicheCat, string[]> = {
  business: ['Consulting', 'Fractional leadership', 'Done-for-you implementation', 'Advisory retainer'],
  money: ['Financial coaching', 'Bookkeeping', 'Portfolio review', 'Planning sessions'],
  tech: ['Freelance build', 'Technical audit', 'Team training', 'Fractional CTO'],
  career: ['1:1 career coaching', 'Resume writing', 'Mock interviews', 'Outplacement workshops'],
  health: ['1:1 coaching', 'Small-group training', 'Programming & check-ins', 'Corporate wellness'],
  mind: ['1:1 coaching', 'Group facilitation', 'Corporate workshops', 'Retreats'],
  relationships: ['Couples coaching', 'Group workshops', 'Intensives', 'Speaking'],
  creative: ['Client work', 'Art direction', 'Content production', 'Teaching workshops'],
};

const COMMUNITY_FORMATS: Record<NicheCat, string[]> = {
  business: ['Paid mastermind', 'Peer accountability pods', 'Slack community', 'Annual summit'],
  money: ['Accountability group', 'Investing club', 'Q&A forum', 'Challenge cohort'],
  tech: ['Discord server', 'Build-in-public cohort', 'Open-source community', 'Study group'],
  career: ['Job-search cohort', 'Alumni network', 'Peer review circle', 'Industry meetups'],
  health: ['Challenge cohort', 'Accountability group', 'Local meetups', 'Members app'],
  mind: ['Circle / sangha', 'Accountability pod', 'Silent co-working', 'Retreat alumni group'],
  relationships: ['Couples circle', 'Support group', 'Facilitated forum', 'Workshop alumni'],
  creative: ['Critique circle', 'Collab challenges', 'Discord server', 'Showcase events'],
};

const CERTIFICATIONS: Record<NicheCat, string[]> = {
  business: ['Business coaching certification', 'Project management (PMP)', 'Six Sigma'],
  money: ['Financial coaching certification', 'CFP / CFA pathways', 'Bookkeeping certification'],
  tech: ['Cloud certifications (AWS/Azure/GCP)', 'Security certifications', 'Vendor product certifications'],
  career: ['Career coaching certification', 'HR / recruiting credentials', 'Facilitation certification'],
  health: ['Personal training certification', 'Nutrition coaching certification', 'Health coach (NBHWC)'],
  mind: ['ICF coaching credential', 'Mindfulness teacher training', 'CBT-informed coaching'],
  relationships: ['Relationship coaching certification', 'Gottman-method training', 'Counselling credentials'],
  creative: ['Adobe certification', 'Craft-specific diplomas', 'Teaching credentials'],
};

function experienceFor(skill: Difficulty, label: string): ExperienceLevel {
  if (/expert|master|advanced|scaling/i.test(label)) return 'Expert (7+ yrs)';
  if (skill === 'Beginner') return 'Entry (0–1 yrs)';
  if (skill === 'Advanced') return 'Experienced (3–7 yrs)';
  return 'Working (1–3 yrs)';
}

/**
 * Competition rises with revenue and demand — crowded niches are crowded
 * because they pay — nudged by a stable per-topic hash so a category isn't a
 * flat block of identical values.
 */
function competitionFor(monetization: Monetization, demand: Level, id: string): Level {
  const base = (levelIndex(monetization) + levelIndex(demand)) / 2;
  const jitter = hash01(id) < 0.3 ? -1 : hash01(id) > 0.8 ? 1 : 0;
  return LEVELS[Math.max(0, Math.min(3, Math.round(base) + jitter))];
}

/** 0–100: rewards demand and revenue, penalises competition. */
function opportunityFor(monetization: Monetization, demand: Level, competition: Level): number {
  const score = (levelIndex(demand) * 30 + levelIndex(monetization) * 25 - levelIndex(competition) * 15 + 45) / 1.4;
  return Math.max(1, Math.min(100, Math.round(score)));
}

const DESC_TEMPLATES = [
  (t: DescCtx) => `${t.label} sits in ${t.parent} › ${t.sub}, a ${t.coaching.toLowerCase()} niche serving ${t.aud}. Demand is ${t.demand.toLowerCase()} with ${t.rev.toLowerCase()} revenue potential (${t.band}).`,
  (t: DescCtx) => `${t.label} is a ${t.skill.toLowerCase()}-level ${t.coaching.toLowerCase()} topic within ${t.parent}. Best suited to ${t.aud}, typically monetised through ${t.offer.toLowerCase()} at ${t.band}.`,
  (t: DescCtx) => `${t.label} — part of the ${t.sub} cluster in ${t.parent}. ${t.demand} market demand, ${t.comp.toLowerCase()} competition, and a natural fit for ${t.format.toLowerCase()}.`,
  (t: DescCtx) => `Coaching and content around ${t.label.toLowerCase()}, mapped to the ${t.industry} industry. Works for ${t.aud} at ${t.skill.toLowerCase()} level, with ${t.rev.toLowerCase()} earning potential.`,
];
interface DescCtx {
  label: string; parent: string; sub: string; coaching: string; industry: string;
  aud: string; demand: Level; comp: Level; rev: Monetization; band: string;
  skill: Difficulty; offer: string; format: string;
}

/**
 * Build a fully-enriched topic from the minimum a caller can know. Used for the
 * built-in library and for admin/custom topics from Firestore, so both carry
 * an identical 21-field profile and behave the same everywhere downstream.
 */
export function deriveTopic(base: {
  id: string; label: string; group: string; parentCategory: string; categoryId: string; subcategory: string;
  niche: NicheCat; businessCategory: string; monetization: Monetization; difficulty: Difficulty;
  audience: Audience[]; keywords?: string[]; industry?: string; demand?: Level; competition?: Level;
  description?: string; related?: string[];
}): EnrichedTopic {
  const industry = base.industry || base.businessCategory;
  const demand = base.demand ?? DEMAND_BY_NICHE[base.niche];
  const competition = base.competition ?? competitionFor(base.monetization, demand, base.id);
  const audience: Audience[] = base.audience.length ? base.audience : ['Individuals'];
  const contentFormats = CONTENT_FORMATS[base.niche];
  const offerTypes = OFFER_TYPES[base.monetization];
  const keywords = base.keywords?.length ? base.keywords : tokens(base.label);
  const ctx: DescCtx = {
    label: base.label, parent: base.parentCategory, sub: base.subcategory, coaching: NICHE_LABEL[base.niche],
    industry, aud: audience.slice(0, 2).join(' and ').toLowerCase(), demand, comp: competition,
    rev: base.monetization, band: REVENUE_BAND[base.monetization], skill: base.difficulty,
    offer: offerTypes[0], format: contentFormats[0],
  };
  return {
    id: base.id,
    label: base.label,
    group: base.group,
    parentCategory: base.parentCategory,
    categoryId: base.categoryId,
    subcategory: base.subcategory,
    description: base.description || DESC_TEMPLATES[Math.floor(hash01(base.id) * DESC_TEMPLATES.length) % DESC_TEMPLATES.length](ctx),
    niche: base.niche,
    coachingType: NICHE_LABEL[base.niche],
    industry,
    businessCategory: base.businessCategory,
    keywords,
    aiTags: Array.from(new Set([slug(base.group), slug(base.parentCategory), slug(base.subcategory), base.niche, slug(base.businessCategory), slug(industry)])),
    difficulty: base.difficulty,
    skillLevel: base.difficulty,
    experienceLevel: experienceFor(base.difficulty, base.label),
    audience,
    monetization: base.monetization,
    revenuePotential: base.monetization,
    revenueBand: REVENUE_BAND[base.monetization],
    marketDemand: demand,
    competitionLevel: competition,
    opportunityScore: opportunityFor(base.monetization, demand, competition),
    contentFormats,
    offerTypes,
    digitalProducts: DIGITAL_PRODUCTS[base.niche],
    services: SERVICES[base.niche],
    communityFormats: COMMUNITY_FORMATS[base.niche],
    certifications: CERTIFICATIONS[base.niche],
    related: base.related ?? [],
    searchTokens: Array.from(new Set([...tokens(base.label), ...keywords])),
  };
}

function audienceFor(base: Audience[], label: string): Audience[] {
  const set = new Set<Audience>(base);
  const l = label.toLowerCase();
  if (/senior|over 40|over 50/.test(l)) set.add('Seniors');
  if (/student|study/.test(l)) set.add('Students');
  if (/parent|new parent|toddler|teen|famil/.test(l)) set.add('Parents');
  if (/creator|youtube|content/.test(l)) set.add('Creators');
  if (/entrepreneur|business|startup|solopreneur/.test(l)) set.add('Business Owners');
  if (/professional|career|executive/.test(l)) set.add('Professionals');
  return [...set];
}

function build(): EnrichedTopic[] {
  const out: EnrichedTopic[] = [];
  const seen = new Set<string>();
  const subMembers = new Map<string, string[]>(); // subKey -> topic ids

  for (const cat of LIBRARY) {
    for (const sub of cat.subs) {
      const mods = sub.mods ?? cat.mods ?? [];
      const subKey = `${cat.id}::${sub.name}`;
      // Subcategory-level overrides fall back to the parent category.
      const niche = sub.niche ?? cat.niche;
      const business = sub.business ?? cat.business;
      const monetization = sub.monetization ?? cat.monetization;
      const audienceBase = sub.audience ?? cat.audience;
      const industry = sub.industry ?? cat.industry ?? business;
      const demand = sub.demand ?? cat.demand ?? DEMAND_BY_NICHE[niche];
      for (let ci = 0; ci < sub.topics.length; ci++) {
        const core = sub.topics[ci];
        const variants = [core, ...mods.map((m) => `${core} ${m}`)];
        for (const label of variants) {
          const id = slug(`${cat.id}-${sub.name}-${label}`);
          if (seen.has(id)) continue;
          seen.add(id);
          const kw = Array.from(new Set([...tokens(label), ...tokens(sub.name), ...tokens(cat.name), ...(cat.keywords ?? [])]));
          const display = label.charAt(0).toUpperCase() + label.slice(1);
          const skill = difficultyFor(label, out.length);
          const competition = sub.competition ?? cat.competition ?? competitionFor(monetization, demand, id);
          const audience = audienceFor(audienceBase, label);
          const contentFormats = CONTENT_FORMATS[niche];
          const offerTypes = OFFER_TYPES[monetization];
          const ctx: DescCtx = {
            label: display, parent: cat.name, sub: sub.name, coaching: NICHE_LABEL[niche], industry,
            aud: audience.slice(0, 2).join(' and ').toLowerCase(), demand, comp: competition,
            rev: monetization, band: REVENUE_BAND[monetization], skill,
            offer: offerTypes[0], format: contentFormats[0],
          };
          const t: EnrichedTopic = {
            id,
            label: display,
            group: cat.group,
            parentCategory: cat.name,
            categoryId: cat.id,
            subcategory: sub.name,
            description: DESC_TEMPLATES[Math.floor(hash01(id) * DESC_TEMPLATES.length) % DESC_TEMPLATES.length](ctx),
            niche,
            coachingType: NICHE_LABEL[niche],
            industry,
            businessCategory: business,
            keywords: kw,
            aiTags: Array.from(new Set([slug(cat.group), slug(cat.name), slug(sub.name), niche, slug(business), slug(industry)])),
            difficulty: skill,
            skillLevel: skill,
            experienceLevel: experienceFor(skill, label),
            audience,
            monetization,
            revenuePotential: monetization,
            revenueBand: REVENUE_BAND[monetization],
            marketDemand: demand,
            competitionLevel: competition,
            opportunityScore: opportunityFor(monetization, demand, competition),
            contentFormats,
            offerTypes,
            digitalProducts: DIGITAL_PRODUCTS[niche],
            services: SERVICES[niche],
            communityFormats: COMMUNITY_FORMATS[niche],
            certifications: CERTIFICATIONS[niche],
            related: [],
            searchTokens: Array.from(new Set([...tokens(label), ...(cat.keywords ?? [])])),
          };
          out.push(t);
          if (!subMembers.has(subKey)) subMembers.set(subKey, []);
          subMembers.get(subKey)!.push(id);
        }
      }
    }
  }

  // Related topics = same-subcategory siblings (up to 8).
  const byId = new Map(out.map((t) => [t.id, t]));
  for (const [subKey, ids] of subMembers) {
    void subKey;
    for (const id of ids) {
      const t = byId.get(id)!;
      t.related = ids.filter((x) => x !== id).slice(0, 8);
    }
  }
  return out;
}

// ---- Cached, computed-once data ------------------------------------------

export const ALL_TOPICS: EnrichedTopic[] = build();
export const TOPIC_COUNT = ALL_TOPICS.length;
export const topicById = new Map(ALL_TOPICS.map((t) => [t.id, t]));

/** Grouped navigation tree: group → categories → subcategories (+ counts). */
export interface NavCategory { id: string; name: string; count: number; subs: { name: string; count: number }[] }
export interface NavGroup { name: string; count: number; categories: NavCategory[] }

export const NAV: NavGroup[] = (() => {
  const groups = new Map<string, Map<string, { name: string; subs: Map<string, number> }>>();
  for (const t of ALL_TOPICS) {
    if (!groups.has(t.group)) groups.set(t.group, new Map());
    const cats = groups.get(t.group)!;
    if (!cats.has(t.categoryId)) cats.set(t.categoryId, { name: t.parentCategory, subs: new Map() });
    const c = cats.get(t.categoryId)!;
    c.subs.set(t.subcategory, (c.subs.get(t.subcategory) ?? 0) + 1);
  }
  return [...groups.entries()].map(([name, cats]) => {
    const categories: NavCategory[] = [...cats.entries()].map(([id, c]) => {
      const subs = [...c.subs.entries()].map(([s, n]) => ({ name: s, count: n }));
      return { id, name: c.name, count: subs.reduce((a, b) => a + b.count, 0), subs };
    });
    return { name, count: categories.reduce((a, b) => a + b.count, 0), categories };
  });
})();

// ---- Filter facets --------------------------------------------------------

/** Taxonomy size — surfaced in the admin analytics tiles. */
export const CATEGORY_COUNT = NAV.reduce((n, g) => n + g.categories.length, 0);
export const SUBCATEGORY_COUNT = NAV.reduce((n, g) => n + g.categories.reduce((m, c) => m + c.subs.length, 0), 0);

/** Flat category lookup for the explorer's category filter + admin. */
export const CATEGORIES: { id: string; name: string; group: string; count: number }[] = NAV
  .flatMap((g) => g.categories.map((c) => ({ id: c.id, name: c.name, group: g.name, count: c.count })))
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * A–Z browsing index: first letter → topic ids, plus the letters actually in
 * use so the alphabet strip can dim empty letters instead of dead-ending.
 */
export const ALPHABET = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letterOf = (label: string) => {
  const c = label.trim().charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
};
export const BY_LETTER: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const t of ALL_TOPICS) {
    const l = letterOf(t.label);
    if (!m.has(l)) m.set(l, []);
    m.get(l)!.push(t.id);
  }
  return m;
})();
export const topicLetter = letterOf;

export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
export const MONETIZATIONS: Monetization[] = ['Low', 'Medium', 'High', 'Very High'];
export const AUDIENCES: Audience[] = ['Individuals', 'Professionals', 'Business Owners', 'Students', 'Parents', 'Seniors', 'Creators'];
export const NICHES: { id: NicheCat; label: string }[] = (Object.keys(NICHE_LABEL) as NicheCat[]).map((id) => ({ id, label: NICHE_LABEL[id] }));
export const BUSINESS_CATEGORIES = Array.from(new Set(ALL_TOPICS.map((t) => t.businessCategory))).sort();
export const GROUPS = NAV.map((g) => g.name);

// ---- Scoring options (backward-compatible with the engine) ---------------

export const topicOptions: QuestionOption[] = ALL_TOPICS.map((t) => ({
  value: t.id,
  label: t.label,
  group: t.parentCategory,
  dimensions: { passion: 4 },
  categories: { [t.niche]: 5 },
}));

// ---- Typo-tolerant indexed search ----------------------------------------

/** Damerau edit distance ≤ 1 (substitution, insertion, deletion, adjacent swap). */
function within1(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  if (la === lb) {
    const diff: number[] = [];
    for (let k = 0; k < la; k++) if (a[k] !== b[k]) diff.push(k);
    if (diff.length === 1) return true; // one substitution
    if (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]) return true; // transposition
    return false;
  }
  // Lengths differ by one → single insertion/deletion.
  const [short, long] = la < lb ? [a, b] : [b, a];
  let i = 0, j = 0, edits = 0;
  while (i < short.length && j < long.length) {
    if (short[i] === long[j]) { i++; j++; } else { if (++edits > 1) return false; j++; }
  }
  return true;
}

export interface SearchResult { topic: EnrichedTopic; score: number }

/**
 * Synonym expansion. Maps everyday phrasing onto the vocabulary the library
 * actually uses, so "make money online" finds side-income topics and "workout"
 * finds training topics. Bidirectional: each group's terms imply each other.
 */
const SYNONYM_GROUPS: string[][] = [
  ['money', 'income', 'earnings', 'cash', 'revenue', 'profit'],
  ['workout', 'exercise', 'training', 'fitness', 'gym'],
  ['food', 'cooking', 'culinary', 'recipes', 'meals'],
  ['weight', 'fat', 'slimming', 'leanness'],
  ['job', 'career', 'employment', 'work', 'profession'],
  ['startup', 'entrepreneurship', 'founder', 'venture'],
  ['ai', 'artificial', 'intelligence', 'llm', 'gpt', 'machine'],
  ['coding', 'programming', 'development', 'software', 'engineering'],
  ['marketing', 'promotion', 'advertising', 'growth'],
  ['selling', 'sales', 'closing', 'revenue'],
  ['kids', 'children', 'child', 'parenting', 'family'],
  ['anxiety', 'stress', 'worry', 'overwhelm'],
  ['happiness', 'wellbeing', 'fulfilment', 'joy'],
  ['dating', 'romance', 'relationship', 'partner', 'love'],
  ['property', 'estate', 'housing', 'rental', 'landlord'],
  ['investing', 'investment', 'stocks', 'portfolio', 'shares'],
  ['video', 'youtube', 'filming', 'footage'],
  ['photo', 'photography', 'camera', 'photos'],
  ['writing', 'copywriting', 'blogging', 'authoring'],
  ['teaching', 'tutoring', 'education', 'training', 'instruction'],
  ['travel', 'trip', 'holiday', 'vacation', 'nomad'],
  ['meditation', 'mindfulness', 'meditate', 'stillness'],
  ['sleep', 'insomnia', 'rest', 'recovery'],
  ['skin', 'skincare', 'beauty', 'complexion'],
  ['pets', 'dog', 'cat', 'animals'],
  ['garden', 'gardening', 'plants', 'growing'],
  ['design', 'graphics', 'visual', 'branding'],
  ['music', 'audio', 'sound', 'production'],
  ['security', 'cybersecurity', 'privacy', 'hacking'],
  ['data', 'analytics', 'metrics', 'reporting'],
];
const SYNONYMS: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      const others = group.filter((x) => x !== term);
      m.set(term, [...(m.get(term) ?? []), ...others]);
    }
  }
  return m;
})();

/**
 * Inverted index: token → topic indices. Built once at module load. Search
 * resolves candidates through this rather than scanning all ~10k topics, and
 * typo tolerance runs against the token *vocabulary* (a few thousand entries)
 * instead of every topic's tokens — the difference between a linear scan of
 * 10k×N and a couple of map lookups.
 */
const TOKEN_INDEX: Map<string, number[]> = (() => {
  const m = new Map<string, number[]>();
  ALL_TOPICS.forEach((t, i) => {
    const seen = new Set<string>([...t.searchTokens, ...t.keywords]);
    for (const tok of seen) {
      let arr = m.get(tok);
      if (!arr) { arr = []; m.set(tok, arr); }
      arr.push(i);
    }
  });
  return m;
})();
const VOCAB: string[] = [...TOKEN_INDEX.keys()];

/** Vocabulary bucketed by first letter — narrows fuzzy and prefix matching. */
const VOCAB_BY_FIRST: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  for (const tok of VOCAB) {
    const c = tok[0];
    let arr = m.get(c);
    if (!arr) { arr = []; m.set(c, arr); }
    arr.push(tok);
  }
  return m;
})();

/** Expand a query token to itself + prefix matches + synonyms + near-misses. */
function expandToken(q: string): { token: string; weight: number }[] {
  const out: { token: string; weight: number }[] = [];
  if (TOKEN_INDEX.has(q)) out.push({ token: q, weight: 10 });
  const bucket = VOCAB_BY_FIRST.get(q[0]) ?? [];
  for (const tok of bucket) {
    if (tok !== q && tok.startsWith(q)) out.push({ token: tok, weight: 6 });
  }
  for (const syn of SYNONYMS.get(q) ?? []) {
    if (TOKEN_INDEX.has(syn)) out.push({ token: syn, weight: 5 });
  }
  if (q.length >= 4 && !TOKEN_INDEX.has(q)) {
    // Typo tolerance: check the vocabulary, not every topic.
    for (const tok of VOCAB) {
      if (Math.abs(tok.length - q.length) <= 1 && within1(tok, q)) out.push({ token: tok, weight: 4 });
    }
  }
  return out;
}

/** Ranked search: indexed, typo-tolerant, synonym-aware. */
export function searchTopics(query: string, limit = 400): EnrichedTopic[] {
  const qTokens = tokens(query);
  if (!qTokens.length) return [];
  const qLabel = query.trim().toLowerCase();
  const scores = new Map<number, number>();

  for (const q of qTokens) {
    // Best weight per topic per query token (not a sum, so a topic matching
    // one token many ways doesn't outrank one matching every token).
    const best = new Map<number, number>();
    for (const { token, weight } of expandToken(q)) {
      for (const idx of TOKEN_INDEX.get(token) ?? []) {
        if ((best.get(idx) ?? 0) < weight) best.set(idx, weight);
      }
    }
    for (const [idx, w] of best) scores.set(idx, (scores.get(idx) ?? 0) + w);
  }

  const results: SearchResult[] = [];
  for (const [idx, score] of scores) {
    const t = ALL_TOPICS[idx];
    // Exact substring on the label is the strongest signal.
    const bonus = t.label.toLowerCase().includes(qLabel) ? 100 : 0;
    results.push({ topic: t, score: score + bonus });
  }
  results.sort((a, b) => b.score - a.score || a.topic.label.length - b.topic.label.length);
  return results.slice(0, limit).map((r) => r.topic);
}

export interface Suggestion { text: string; kind: 'topic' | 'category' | 'subcategory' | 'synonym'; id?: string }

/**
 * Auto-complete / search suggestions. Blends matching topic labels, categories
 * and subcategories, and surfaces a synonym hint when the query has a well-known
 * everyday equivalent ("workout" → try "training").
 */
export function suggestSearch(query: string, limit = 8): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const push = (s: Suggestion) => {
    const key = `${s.kind}:${s.text.toLowerCase()}`;
    if (!seen.has(key) && out.length < limit) { seen.add(key); out.push(s); }
  };

  // The synonym hint goes first: it is a "try this wording instead" nudge, and
  // it is worthless buried under ten topic matches (or dropped by the limit).
  const syn = SYNONYMS.get(q);
  if (syn?.length) push({ text: syn[0], kind: 'synonym' });

  for (const c of CATEGORIES) if (c.name.toLowerCase().includes(q)) push({ text: c.name, kind: 'category', id: c.id });
  for (const g of NAV) {
    for (const c of g.categories) {
      for (const s of c.subs) if (s.name.toLowerCase().startsWith(q)) push({ text: s.name, kind: 'subcategory', id: c.id });
    }
  }
  for (const t of searchTopics(query, 40)) push({ text: t.label, kind: 'topic', id: t.id });
  return out;
}

// ---- Recommendations ("You may also be interested in…") ------------------

/**
 * Recommend topics from the user's current selection using related topics +
 * shared AI tags/keywords, optionally weighted by popularity (learned counts).
 */
export function recommendTopics(selectedIds: string[], popularity?: Map<string, number>, limit = 12): EnrichedTopic[] {
  if (!selectedIds.length) return [];
  const selected = new Set(selectedIds);
  const tagWeight = new Map<string, number>();
  const kwWeight = new Map<string, number>();
  const scores = new Map<string, number>();

  for (const id of selectedIds) {
    const t = topicById.get(id);
    if (!t) continue;
    for (const tag of t.aiTags) tagWeight.set(tag, (tagWeight.get(tag) ?? 0) + 1);
    for (const kw of t.keywords) kwWeight.set(kw, (kwWeight.get(kw) ?? 0) + 1);
    for (const rid of t.related) if (!selected.has(rid)) scores.set(rid, (scores.get(rid) ?? 0) + 3);
  }
  for (const t of ALL_TOPICS) {
    if (selected.has(t.id)) continue;
    let s = scores.get(t.id) ?? 0;
    for (const tag of t.aiTags) s += tagWeight.get(tag) ?? 0;
    for (const kw of t.keywords) s += (kwWeight.get(kw) ?? 0) * 0.5;
    if (popularity) s += Math.min(3, (popularity.get(t.id) ?? 0) * 0.5);
    if (s > 0) scores.set(t.id, s);
  }
  return [...scores.entries()]
    .filter(([id]) => !selected.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => topicById.get(id)!)
    .filter(Boolean);
}

/** Detect near-duplicate / very similar topics to an id (shared keywords). */
export function similarTopics(id: string, limit = 5): EnrichedTopic[] {
  const t = topicById.get(id);
  if (!t) return [];
  const kw = new Set(t.keywords);
  return ALL_TOPICS.filter((o) => o.id !== id && o.categoryId === t.categoryId)
    .map((o) => ({ o, overlap: o.keywords.filter((k) => kw.has(k)).length }))
    .filter((x) => x.overlap >= 2)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((x) => x.o);
}

// ---- Smart collections ----------------------------------------------------

export interface SmartCollection {
  id: string;
  name: string;
  description: string;
  match: (t: EnrichedTopic) => boolean;
}

/**
 * Dynamic, rule-based collections. These are computed against the live topic
 * set rather than hand-curated lists, so they stay correct as the library grows
 * or an admin disables topics.
 */
export const SMART_COLLECTIONS: SmartCollection[] = [
  {
    id: 'hidden-gems', name: '💎 Hidden gems', description: 'Strong demand and revenue, but competition is still low',
    match: (t) => levelIndex(t.marketDemand) >= 2 && levelIndex(t.competitionLevel) <= 1 && levelIndex(t.revenuePotential) >= 2,
  },
  {
    id: 'quick-start', name: '🚀 Quick to start', description: 'Beginner-friendly with a clear path to a first offer',
    match: (t) => t.skillLevel === 'Beginner' && levelIndex(t.revenuePotential) >= 2,
  },
  {
    id: 'high-ticket', name: '💰 High-ticket potential', description: 'Supports premium pricing and done-for-you work',
    match: (t) => t.revenuePotential === 'Very High',
  },
  {
    id: 'high-demand', name: '🔥 High demand', description: 'Large, actively searching audiences',
    match: (t) => t.marketDemand === 'Very High',
  },
  {
    id: 'low-competition', name: '🎯 Low competition', description: 'Room to become a recognised voice quickly',
    match: (t) => t.competitionLevel === 'Low',
  },
  {
    id: 'best-opportunity', name: '⭐ Best opportunity score', description: 'Top-rated blend of demand, revenue and competition',
    match: (t) => t.opportunityScore >= 75,
  },
  {
    id: 'evergreen', name: '🌲 Evergreen', description: 'Steady, non-faddish topics people search year after year',
    match: (t) => levelIndex(t.marketDemand) >= 2 && t.skillLevel !== 'Advanced' && !/ai |crypto|nft|web3/i.test(t.label),
  },
  {
    id: 'service-ready', name: '🤝 Service-ready', description: 'Naturally sold as 1:1 or done-for-you services',
    match: (t) => levelIndex(t.revenuePotential) >= 2 && (t.niche === 'business' || t.niche === 'career' || t.niche === 'money'),
  },
  {
    id: 'community-led', name: '👥 Community-led', description: 'Thrives on membership and group formats',
    match: (t) => t.niche === 'health' || t.niche === 'mind' || t.niche === 'relationships',
  },
  {
    id: 'creator-friendly', name: '🎨 Creator-friendly', description: 'Content-first topics with strong audience potential',
    match: (t) => t.niche === 'creative' || t.audience.includes('Creators'),
  },
];

export function collectionTopics(id: string, pool: EnrichedTopic[] = ALL_TOPICS): EnrichedTopic[] {
  const c = SMART_COLLECTIONS.find((x) => x.id === id);
  return c ? pool.filter(c.match) : [];
}

// ---- Interest profile & overlap analysis ---------------------------------

export interface OverlapPair { a: EnrichedTopic; b: EnrichedTopic; overlap: number }

/**
 * Find selected topics that substantially duplicate each other — same
 * subcategory, or heavy keyword overlap within a category.
 */
export function detectOverlaps(selectedIds: string[], lookup: (id: string) => EnrichedTopic | undefined = (id) => topicById.get(id)): OverlapPair[] {
  const picked = selectedIds.map(lookup).filter(Boolean) as EnrichedTopic[];
  const pairs: OverlapPair[] = [];
  for (let i = 0; i < picked.length; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      const a = picked[i], b = picked[j];
      if (a.categoryId !== b.categoryId) continue;
      const kw = new Set(a.keywords);
      const shared = b.keywords.filter((k) => kw.has(k)).length;
      const sameSub = a.subcategory === b.subcategory;
      if (sameSub && shared >= 3) pairs.push({ a, b, overlap: shared + 2 });
      else if (shared >= 4) pairs.push({ a, b, overlap: shared });
    }
  }
  return pairs.sort((x, y) => y.overlap - x.overlap);
}

export interface InterestProfile {
  count: number;
  confidence: number; // 0–100
  confidenceLabel: 'Low' | 'Building' | 'Strong' | 'Very strong';
  topNiches: { niche: NicheCat; label: string; count: number; share: number }[];
  topCategories: { id: string; name: string; count: number }[];
  topIndustries: { name: string; count: number }[];
  audiences: { name: Audience; count: number }[];
  skillMix: Record<Difficulty, number>;
  avgOpportunity: number;
  avgDemand: number;
  avgRevenue: number;
  breadth: number; // distinct categories touched
  focus: number; // 0–100, how concentrated the selection is
  overlaps: OverlapPair[];
  gaps: string[];
  complementary: EnrichedTopic[];
}

/**
 * Build the interest profile shown before the user advances a step: what their
 * selection says about them, how confident we can be in it, what overlaps, and
 * which complementary topics would round it out.
 */
export function buildInterestProfile(
  selectedIds: string[],
  lookup: (id: string) => EnrichedTopic | undefined = (id) => topicById.get(id),
): InterestProfile {
  const picked = selectedIds.map(lookup).filter(Boolean) as EnrichedTopic[];
  const empty: InterestProfile = {
    count: 0, confidence: 0, confidenceLabel: 'Low', topNiches: [], topCategories: [], topIndustries: [],
    audiences: [], skillMix: { Beginner: 0, Intermediate: 0, Advanced: 0 }, avgOpportunity: 0, avgDemand: 0,
    avgRevenue: 0, breadth: 0, focus: 0, overlaps: [], gaps: [], complementary: [],
  };
  if (!picked.length) return empty;

  const tally = <K extends string>(items: K[]) => {
    const m = new Map<K, number>();
    for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const nicheCounts = tally(picked.map((t) => t.niche));
  const catCounts = tally(picked.map((t) => t.categoryId));
  const industryCounts = tally(picked.map((t) => t.industry));
  const audienceCounts = tally(picked.flatMap((t) => t.audience));

  const skillMix: Record<Difficulty, number> = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  for (const t of picked) skillMix[t.skillLevel]++;

  const avg = (ns: number[]) => Math.round(ns.reduce((a, b) => a + b, 0) / ns.length);
  const breadth = new Set(picked.map((t) => t.categoryId)).size;
  // Focus: how much of the selection sits in its single biggest niche.
  const focus = Math.round(((nicheCounts[0]?.[1] ?? 0) / picked.length) * 100);

  /**
   * Confidence blends *how much* was chosen with *how coherent* it is. A single
   * pick can't be confident however clear it looks; twenty scattered picks
   * across unrelated niches shouldn't score as high as twelve focused ones.
   */
  const volume = Math.min(1, picked.length / 12);
  const coherence = focus / 100;
  const spread = Math.min(1, breadth / 6);
  const confidence = Math.round(Math.min(100, (volume * 0.5 + coherence * 0.3 + spread * 0.2) * 100));
  const confidenceLabel: InterestProfile['confidenceLabel'] =
    confidence >= 80 ? 'Very strong' : confidence >= 60 ? 'Strong' : confidence >= 35 ? 'Building' : 'Low';

  // Gaps: dimensions the selection is missing that would sharpen the result.
  const gaps: string[] = [];
  if (picked.length < 5) gaps.push('Pick a few more topics — five or more gives a much sharper result.');
  if (breadth === 1) gaps.push('Everything sits in one category. Adding an adjacent area often reveals a stronger angle.');
  if (focus < 30) gaps.push('Your picks are spread thin across niches. Leaning into one or two would sharpen the recommendation.');
  if (!skillMix.Beginner && !skillMix.Intermediate) gaps.push('All advanced topics — consider adding the foundations you would teach first.');
  if (!picked.some((t) => levelIndex(t.revenuePotential) >= 2)) gaps.push('None of your picks are high-revenue. Add one if income matters to you.');

  // Complementary: strong recommendations that sit outside the chosen categories.
  const chosenCats = new Set(picked.map((t) => t.categoryId));
  const complementary = recommendTopics(selectedIds, undefined, 40)
    .filter((t) => !chosenCats.has(t.categoryId))
    .slice(0, 8);

  return {
    count: picked.length,
    confidence,
    confidenceLabel,
    topNiches: nicheCounts.slice(0, 5).map(([niche, count]) => ({
      niche, label: NICHE_LABEL[niche], count, share: Math.round((count / picked.length) * 100),
    })),
    topCategories: catCounts.slice(0, 5).map(([id, count]) => ({
      id, name: topicById.get(picked.find((t) => t.categoryId === id)!.id)?.parentCategory ?? id, count,
    })),
    topIndustries: industryCounts.slice(0, 5).map(([name, count]) => ({ name, count })),
    audiences: audienceCounts.slice(0, 4).map(([name, count]) => ({ name, count })),
    skillMix,
    avgOpportunity: avg(picked.map((t) => t.opportunityScore)),
    avgDemand: avg(picked.map((t) => levelIndex(t.marketDemand) * 33 + 1)),
    avgRevenue: avg(picked.map((t) => levelIndex(t.revenuePotential) * 33 + 1)),
    breadth,
    focus,
    overlaps: detectOverlaps(selectedIds, lookup).slice(0, 5),
    gaps,
    complementary,
  };
}

// ---- Curated popular / trending seeds (blended with learned counts) ------

export const POPULAR_SEED = new Set(
  ALL_TOPICS.filter((t) => /weight loss|personal finance|budgeting|youtube growth|instagram growth|copywriting|dropshipping|meditation|confidence building|dog training|resume writing|public speaking|freelance writing|stock market/i.test(t.label) && !/ for | advanced| intermediate/i.test(t.label)).map((t) => t.id),
);
export const TRENDING_SEED = new Set(
  ALL_TOPICS.filter((t) => /chatgpt|prompt engineering|ai for business|ai content|ai automation|ai agents|faceless youtube|short-form video|no-code|crypto investing/i.test(t.label) && !/ for | advanced/i.test(t.label)).map((t) => t.id),
);
