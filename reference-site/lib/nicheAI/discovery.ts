/**
 * Pure helpers for the niche discovery experience.
 *
 * Everything here is framework-free and deterministic so the discovery UI stays
 * a thin rendering layer: icons, search highlighting and the recommendation
 * rails are all decided here and unit-tested, not inside components.
 *
 * Rails are *rules over the live library*, never hand-curated id lists, so they
 * stay correct as the taxonomy grows or an admin disables topics.
 */

import { POPULAR_SEED, TRENDING_SEED, type EnrichedTopic } from './topicEngine';

/* -------------------------------------------------------------------------- */
/*  Category icons                                                            */
/* -------------------------------------------------------------------------- */

/** Fallback icon per top-level group — every category resolves to something. */
const GROUP_ICON: Record<string, string> = {
  Business: '💼',
  'Marketing & Sales': '📣',
  'Money & Finance': '💰',
  'Career & Work': '🧭',
  'Health & Fitness': '🏋',
  'Food & Cooking': '🍳',
  'Mind & Growth': '🧠',
  'Relationships & Family': '❤️',
  'Technology & AI': '🤖',
  'Creative & Content': '🎨',
  'Education & Skills': '🎓',
  'Lifestyle & Hobbies': '🌍',
  'Home & Living': '🏡',
};

/**
 * Keyword rules, most specific first. Matching on the category *name* keeps all
 * 204 categories covered without hand-listing every one, and new categories
 * inherit a sensible icon automatically.
 *
 * Glyphs are kept to Emoji 11 and earlier: newer additions (🫂 U+1FAC2,
 * 🪑 U+1FA91, 🦾 U+1F9BE) render as tofu boxes on stock Windows 10 fonts,
 * which is worse than a slightly less specific icon.
 */
const CATEGORY_ICON_RULES: [RegExp, string][] = [
  [/real estate|home buying|renting|tenancy/i, '🏘'],
  [/crypto|blockchain|web3/i, '⛓'],
  [/trading|forex|derivativ/i, '📈'],
  [/invest|portfolio|alternative invest/i, '📊'],
  [/tax/i, '🧾'],
  [/insurance|risk/i, '🛡'],
  [/debt|credit|banking|cash management/i, '🏦'],
  [/retirement|estate|legacy planning/i, '🕰'],
  [/ai |artificial intelligence|machine learning|llm/i, '🤖'],
  [/data|analytics|business intelligence/i, '📊'],
  [/cyber|security|privacy|safety/i, '🔐'],
  [/cloud|devops|infrastructure|platform engineering|api/i, '☁️'],
  [/software|developer|programming|web development|mobile development|qa |testing|tooling/i, '💻'],
  [/game/i, '🎮'],
  [/robot|iot|maker/i, '⚙️'],
  [/no-code|automation/i, '⚡'],
  [/ux|product design|interior design|graphic design|brand identity|fashion|textile/i, '🎨'],
  [/product management/i, '🧩'],
  [/seo|search/i, '🔍'],
  [/advertis|paid/i, '📢'],
  [/copywrit|writing|publishing|books|screenwrit|technical writing/i, '✍️'],
  [/email|sms|messaging|newsletter/i, '✉️'],
  [/sales|account-based/i, '🤝'],
  [/brand/i, '🏷'],
  [/social media|influencer|creator/i, '📱'],
  [/youtube|video|film/i, '🎬'],
  [/podcast|voice|audio|music/i, '🎙'],
  [/photograph|illustration|fine art|comics/i, '📷'],
  [/animation|motion/i, '🎞'],
  [/craft|handmade|collect/i, '🧵'],
  [/fitness|training|sports|performance|martial|combat/i, '🏋'],
  [/yoga|pilates|mind-body|low-impact/i, '🧘'],
  [/nutrition|diet/i, '🥗'],
  [/mental health|addiction|recovery|self-therapy/i, '💚'],
  [/dental|oral/i, '🦷'],
  [/skin|hair/i, '💆'],
  [/vision|hearing/i, '👁'],
  [/women's|men's|ageing|integrative|wellness|health/i, '⚕️'],
  [/dance|movement/i, '💃'],
  [/cook|culinary|food|recipe/i, '🍳'],
  [/meditation|spiritual|faith|religio/i, '🕊'],
  [/mindset|psychology|philosophy|critical thinking|decision/i, '🧠'],
  [/productivity|focus/i, '⏱'],
  [/personal development|creativity|ideation|wellbeing/i, '🌱'],
  [/dating|relationship/i, '❤️'],
  [/parenting|newborn|teens|adoption|fostering|grandparent|family/i, '👨‍👩‍👧'],
  [/community|belonging/i, '👥'],
  [/leadership|management|people leadership/i, '🧭'],
  [/career|job search|hiring|reinvention/i, '🚀'],
  [/hr|talent/i, '👔'],
  [/project|program management/i, '📋'],
  [/consult|advisor|mentor/i, '🎯'],
  [/healthcare career/i, '⚕️'],
  [/legal|compliance/i, '⚖️'],
  [/education career|teaching|tutor|course|instructional|edtech|homeschool/i, '🎓'],
  [/trades|technical career/i, '🔧'],
  [/public sector|nonprofit|social impact/i, '🏛'],
  [/language/i, '🗣'],
  [/speaking|presenting/i, '🎤'],
  [/study|exam|certification|research|academic|learning how to learn/i, '📚'],
  [/corporate training|l&d/i, '🏫'],
  [/travel|nomad|adventure|outdoor/i, '✈️'],
  [/pets|animal|wildlife|nature/i, '🐾'],
  [/sustainab|environment|self-sufficient/i, '🌿'],
  [/garden|growing/i, '🌻'],
  [/board|tabletop/i, '🎲'],
  [/esports/i, '🕹'],
  [/astronomy|science hobb/i, '🔭'],
  [/cycling|motorsport|cars|automotive/i, '🚗'],
  [/home improvement|diy|maintenance|systems/i, '🛠'],
  [/organiz|declutter|cleaning|household/i, '🧹'],
  [/home security/i, '🔒'],
  [/home office|workspace/i, '🖥'],
  [/lifestyle|home/i, '🏡'],
  [/e-commerce|retail|marketplace|import|export|trading business/i, '🛒'],
  [/saas|subscription|membership/i, '🔁'],
  [/startup|innovation/i, '💡'],
  [/agency|freelanc|coaching & consulting/i, '🤝'],
  [/franchis|licens/i, '🏪'],
  [/hospitality/i, '🍽'],
  [/operations|supply chain|procurement|vendor/i, '📦'],
  [/business/i, '💼'],
  [/finance|money|financial|frugal|side income/i, '💰'],
  [/marketing|growth|content strategy|pr &|communications/i, '📣'],
];

/** Deterministic icon for a category. Falls back to its group, then a globe. */
export function iconForCategory(name: string, group?: string): string {
  for (const [re, icon] of CATEGORY_ICON_RULES) if (re.test(name)) return icon;
  return (group && GROUP_ICON[group]) || '🌐';
}

export function iconForGroup(group: string): string {
  return GROUP_ICON[group] ?? '🌐';
}

/* -------------------------------------------------------------------------- */
/*  Search highlighting                                                       */
/* -------------------------------------------------------------------------- */

export interface HighlightPart {
  text: string;
  hit: boolean;
}

const MIN_HIGHLIGHT = 2;

/**
 * Split `text` into matched / unmatched runs for the current query.
 *
 * Works token-by-token (so "fitness coach" highlights both words wherever they
 * appear) and merges overlapping matches, which is why this returns runs rather
 * than doing a naive global replace — replace would corrupt the string when two
 * query tokens overlap in the source.
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length >= MIN_HIGHLIGHT);
  if (!text || !terms.length) return [{ text, hit: false }];

  const haystack = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = 0;
    for (;;) {
      const at = haystack.indexOf(term, from);
      if (at === -1) break;
      ranges.push([at, at + term.length]);
      from = at + term.length;
    }
  }
  if (!ranges.length) return [{ text, hit: false }];

  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const parts: HighlightPart[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), hit: false });
    parts.push({ text: text.slice(start, end), hit: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });
  return parts;
}

/* -------------------------------------------------------------------------- */
/*  Match score                                                               */
/* -------------------------------------------------------------------------- */

/**
 * How well a topic fits what the user has already picked, 0–100.
 *
 * Explainable on purpose — it is a weighted blend of four concrete overlaps
 * rather than an opaque number, so "82% match" can always be justified:
 * same coaching niche (40) · shared AI tags (30) · shared audience (15) ·
 * same industry (15).
 *
 * Returns `undefined` when nothing is selected yet — a match score against an
 * empty profile would be meaningless, and showing one would be a lie.
 */
export function affinityScore(topic: EnrichedTopic, selected: EnrichedTopic[]): number | undefined {
  if (!selected.length) return undefined;

  const niches = new Set(selected.map((t) => t.niche));
  const industries = new Set(selected.map((t) => t.industry));
  const tags = new Set(selected.flatMap((t) => t.aiTags));
  const audiences = new Set(selected.flatMap((t) => t.audience));

  let score = 0;
  if (niches.has(topic.niche)) score += 40;
  if (industries.has(topic.industry)) score += 15;
  if (topic.audience.some((a) => audiences.has(a))) score += 15;
  if (topic.aiTags.length) {
    const shared = topic.aiTags.filter((t) => tags.has(t)).length;
    score += Math.round((shared / topic.aiTags.length) * 30);
  }
  return Math.max(0, Math.min(100, score));
}

/* -------------------------------------------------------------------------- */
/*  Discovery rails                                                           */
/* -------------------------------------------------------------------------- */

const LEVEL_ORDER = ['Low', 'Medium', 'High', 'Very High'];
const atLeast = (value: string, floor: string) => LEVEL_ORDER.indexOf(value) >= LEVEL_ORDER.indexOf(floor);

export type RailId = 'recommended' | 'trending' | 'fast-growing' | 'high-income' | 'beginner' | 'most-selected';

export interface Rail {
  id: RailId;
  title: string;
  blurb: string;
  icon: string;
  /**
   * Pure rule over the library. Rails that depend on runtime context
   * (`recommended`, `most-selected`) have none and are resolved by `railTopics`.
   */
  match?: (t: EnrichedTopic) => boolean;
}

export const RAILS: Rail[] = [
  {
    id: 'recommended',
    title: 'Recommended for You',
    blurb: 'Based on what you have picked so far',
    icon: '✨',
  },
  {
    id: 'trending',
    title: 'Trending Niches',
    blurb: 'Rising interest right now',
    icon: '🔥',
    match: (t) => TRENDING_SEED.has(t.id),
  },
  {
    id: 'fast-growing',
    title: 'Fast Growing Niches',
    blurb: 'Very high demand with room to win',
    icon: '📈',
    match: (t) => t.marketDemand === 'Very High' && t.opportunityScore >= 70,
  },
  {
    id: 'high-income',
    title: 'High Income Niches',
    blurb: 'Support premium pricing and done-for-you work',
    icon: '💎',
    match: (t) => t.revenuePotential === 'Very High',
  },
  {
    id: 'beginner',
    title: 'Beginner Friendly Niches',
    blurb: 'A clear path to your first offer',
    icon: '🌱',
    match: (t) => t.skillLevel === 'Beginner' && atLeast(t.revenuePotential, 'High'),
  },
  {
    id: 'most-selected',
    title: 'Most Selected Niches',
    blurb: 'What other coaches choose most often',
    icon: '⭐',
  },
];

export interface RailContext {
  /** Learned selection counts, from `topicStats.popularityMap()`. */
  popularity?: Map<string, number>;
  /** Engine recommendations for the current selection. */
  recommended?: EnrichedTopic[];
}

/**
 * Resolve a rail to its topics. Rule-based rails filter the pool; the two
 * context-driven rails read from `ctx`, falling back to the popular seed so a
 * first-time visitor never sees an empty rail.
 */
export function railTopics(id: RailId, pool: EnrichedTopic[], ctx: RailContext = {}, limit = 12): EnrichedTopic[] {
  if (id === 'recommended') return (ctx.recommended ?? []).slice(0, limit);

  if (id === 'most-selected') {
    const counts = ctx.popularity;
    const ranked = counts?.size
      ? [...pool]
          .filter((t) => (counts.get(t.id) ?? 0) > 0)
          .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
      : [];
    if (ranked.length >= limit) return ranked.slice(0, limit);
    // Top up from the editorial popular seed so the rail is never thin.
    const seen = new Set(ranked.map((t) => t.id));
    const seeded = pool.filter((t) => POPULAR_SEED.has(t.id) && !seen.has(t.id));
    return [...ranked, ...seeded].slice(0, limit);
  }

  const rail = RAILS.find((r) => r.id === id);
  if (!rail?.match) return [];
  const out: EnrichedTopic[] = [];
  for (const t of pool) {
    if (rail.match(t)) out.push(t);
    if (out.length >= limit * 4) break; // enough to sort meaningfully without a full scan
  }
  return out.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, limit);
}
