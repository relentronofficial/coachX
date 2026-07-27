/**
 * Niche market-intelligence knowledge base.
 *
 * Builds on the original CoachX niche taxonomy (`lib/niches.ts`) and layers an
 * editorial market model (profitability / demand / competition / difficulty /
 * revenue) plus qualitative content seeds used to generate the report fields.
 *
 * All numbers are ORIGINAL editorial estimates (a deterministic model), NOT
 * scraped or third-party data. They exist to make the intelligence engine
 * explainable and reproducible.
 */

import { categories, niches, categoryName, type Niche } from '@/lib/niches';
import { formatINR, usdToInr } from '@/lib/currency';

export { categories, niches, categoryName };
export type { Niche };

export interface NicheMarket {
  /** 0–100 editorial market model. */
  profitability: number;
  demand: number;
  competition: number; // higher = more crowded
  difficulty: number; // higher = harder to start
  /**
   * Monthly revenue potential band for an established solo coach, authored in
   * USD. Converted to INR for display via `usdToInr` — these figures are shown,
   * never scored on, so converting changes no ranking. See `lib/currency.ts`.
   */
  revenue: { low: number; high: number };
}

export interface NicheContent {
  audience: string;
  positioning: string;
  uvp: string;
  opportunities: string[];
  contentPillars: string[];
  offers: string[];
  products: string[];
  community: string[];
  pricing: string[];
  marketing: string[];
}

// Per-category baseline market posture (0–100). Individual niches nudge these.
const CATEGORY_MARKET: Record<string, Partial<NicheMarket>> = {
  health: { profitability: 74, competition: 78, difficulty: 55, revenue: { low: 2500, high: 18000 } },
  mind: { profitability: 70, competition: 66, difficulty: 48, revenue: { low: 2000, high: 15000 } },
  relationships: { profitability: 66, competition: 58, difficulty: 46, revenue: { low: 1800, high: 12000 } },
  money: { profitability: 84, competition: 72, difficulty: 62, revenue: { low: 3000, high: 30000 } },
  career: { profitability: 76, competition: 60, difficulty: 50, revenue: { low: 2500, high: 20000 } },
  business: { profitability: 88, competition: 80, difficulty: 64, revenue: { low: 4000, high: 45000 } },
  tech: { profitability: 82, competition: 55, difficulty: 58, revenue: { low: 3000, high: 28000 } },
  creative: { profitability: 64, competition: 74, difficulty: 44, revenue: { low: 1500, high: 14000 } },
};

// Selective per-niche overrides where the editorial model differs from the
// category baseline. Everything else is derived deterministically below.
const NICHE_OVERRIDES: Record<string, Partial<NicheMarket>> = {
  'ai-tools': { profitability: 90, demand: 96, competition: 48, difficulty: 52, revenue: { low: 3500, high: 35000 } },
  'coaching-business': { profitability: 92, demand: 90, competition: 82 },
  'course-creation': { profitability: 89, demand: 88, competition: 76 },
  marketing: { profitability: 86, demand: 90, competition: 84 },
  investing: { profitability: 88, demand: 86, competition: 70, difficulty: 68 },
  'personal-finance': { profitability: 80, demand: 92, competition: 74 },
  'career-growth': { profitability: 78, demand: 88, competition: 58 },
  'content-creation': { profitability: 70, demand: 94, competition: 86 },
  fitness: { profitability: 72, demand: 92, competition: 88 },
  mindset: { profitability: 74, demand: 90, competition: 70 },
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Deterministic market model for a niche (baseline + overrides + demand map). */
export function marketFor(niche: Niche): NicheMarket {
  const base = CATEGORY_MARKET[niche.categoryId] ?? {};
  const over = NICHE_OVERRIDES[niche.id] ?? {};
  // Map the taxonomy demand (1–5) into a 0–100 demand score, then let overrides win.
  const demandFromTaxonomy = clamp(40 + niche.demand * 11);
  return {
    profitability: clamp(over.profitability ?? base.profitability ?? 70),
    demand: clamp(over.demand ?? demandFromTaxonomy),
    competition: clamp(over.competition ?? base.competition ?? 65),
    difficulty: clamp(over.difficulty ?? base.difficulty ?? 52),
    revenue: over.revenue ?? base.revenue ?? { low: 2000, high: 15000 },
  };
}

// ---------------------------------------------------------------------------
// Qualitative content generation.
//
// A small curated library for flagship niches, plus deterministic generators
// that build rich, personalized content for every other niche from its
// taxonomy (title, category, sub-niches, audiences, deliveries).
// ---------------------------------------------------------------------------

const CURATED: Record<string, Partial<NicheContent>> = {
  'ai-tools': {
    positioning: 'The practical AI guide for non-technical professionals who want results, not jargon.',
    uvp: 'You turn overwhelming AI hype into 3–4 repeatable workflows that save your clients hours every week.',
    opportunities: [
      'Corporate "AI for teams" workshops (highest ticket)',
      'Productized "AI audit" of a business\'s workflows',
      'Templated prompt libraries by industry',
    ],
    contentPillars: ['AI workflows in plain English', 'Tool teardowns', 'Before/after time savings', 'Ethics & safety'],
    offers: ['90-min "AI Quickstart" intensive', '6-week "AI Operator" cohort', 'Done-with-you automation sprint'],
    products: ['Industry prompt packs', 'Notion AI-workflow OS', 'Recorded tool masterclasses'],
  },
  'coaching-business': {
    positioning: 'The systems-first mentor for experts who are great at the craft but stuck on getting clients.',
    uvp: 'You install a predictable client-getting system so coaches stop guessing and start booking.',
    opportunities: ['High-ticket 1:1 mentorship', 'Group accelerator', 'Certification / licensing track'],
  },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Build the full qualitative content set for a niche (curated ∪ generated). */
export function contentFor(niche: Niche): NicheContent {
  const cat = categoryName(niche.categoryId);
  const c = CURATED[niche.id] ?? {};
  const sub = niche.subNiches;
  const first = sub[0] ?? niche.title;

  return {
    audience: c.audience ?? `People seeking real progress in ${niche.title.toLowerCase()} — especially ${audienceLabel(niche)}.`,
    positioning:
      c.positioning ?? `The go-to ${cat.toLowerCase()} coach for ${audienceLabel(niche)} who want ${first.toLowerCase()} without the overwhelm.`,
    uvp:
      c.uvp ?? `You help ${audienceLabel(niche)} achieve ${first.toLowerCase()} with a clear, proven path — not generic advice.`,
    opportunities:
      c.opportunities ?? [
        `Signature 1:1 ${niche.title} coaching program`,
        `Group cohort focused on ${first.toLowerCase()}`,
        `Corporate / partner workshops on ${cat.toLowerCase()}`,
      ],
    contentPillars:
      c.contentPillars ?? [
        `${cap(first)} fundamentals`,
        `Common mistakes in ${niche.title.toLowerCase()}`,
        `Client wins & case studies`,
        `Quick, actionable ${cat.toLowerCase()} tips`,
      ],
    offers:
      c.offers ?? [
        `Free "${niche.title} Roadmap" call`,
        `4-week "${cap(first)}" starter program`,
        `12-week ${niche.title} transformation`,
      ],
    products:
      c.products ?? [
        `${niche.title} self-paced course`,
        `${cap(first)} templates & checklists`,
        `Resource library / mini-membership`,
      ],
    community:
      c.community ?? [
        `Private ${niche.title} community`,
        `Monthly live Q&A / hot-seats`,
        `Accountability pods around ${first.toLowerCase()}`,
      ],
    pricing:
      c.pricing ?? [
        `Entry course: ${formatINR(usdToInr(sub.length * 20 + 49, 500))}`,
        `Group cohort: ${formatINR(usdToInr(300 + niche.demand * 120, 1000))}`,
        `1:1 package: ${formatINR(usdToInr(1200 + niche.demand * 400, 5000))}`,
      ],
    marketing:
      c.marketing ?? [
        `Short-form video on ${first.toLowerCase()}`,
        `A weekly email teaching one ${cat.toLowerCase()} idea`,
        `Free lead magnet: "${niche.title} Starter Kit"`,
      ],
  };
}

function audienceLabel(niche: Niche): string {
  const map: Record<string, string> = {
    individuals: 'everyday people',
    professionals: 'working professionals',
    businesses: 'business owners',
    students: 'students & early-career people',
    parents: 'parents & families',
    seniors: 'older adults',
  };
  return niche.audiences.map((a) => map[a] ?? a).slice(0, 2).join(' and ');
}
