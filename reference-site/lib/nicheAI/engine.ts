/**
 * CoachX Intelligence Engine.
 *
 * A pure, deterministic scoring + recommendation engine. Given the effective
 * question set and a user's answers it produces the full AnalysisResult — a
 * ranked top-5 of niches, each with the 24 intelligence fields, plus a
 * per-dimension user profile, cross-cutting insights and next steps.
 *
 * No network, no randomness in the scoring path, fully unit-testable. Presented
 * in the product as the "CoachX Intelligence Engine".
 */

import {
  DEFAULT_WEIGHTS,
  DIMENSIONS,
  type AnalysisResult,
  type Answers,
  type AnswerValue,
  type Dimension,
  type Level,
  type NicheRecommendation,
  type Question,
  type ScoringWeights,
} from './types';
import { categoryName, contentFor, marketFor, niches, type Niche } from './knowledgeBase';
import { formatINRRange, usdToInr } from '@/lib/currency';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const round = (n: number) => Math.round(n);

// ---------------------------------------------------------------------------
// Answer helpers.
// ---------------------------------------------------------------------------

export function asArray(v: AnswerValue | undefined): string[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v) return [v];
  return [];
}

/** Is a conditional question currently visible given the answers so far? */
export function isVisible(q: Question, answers: Answers): boolean {
  if (!q.enabled) return false;
  const cond = q.showIf;
  if (!cond) return true;
  const dep = answers[cond.questionId];
  if (cond.equals !== undefined) return dep === cond.equals;
  if (cond.includesAny) {
    const arr = asArray(dep);
    return cond.includesAny.some((v) => arr.includes(v));
  }
  return true;
}

/** The ordered, visible question set for the current answers (branching-aware). */
export function visibleQuestions(questions: Question[], answers: Answers): Question[] {
  return questions
    .filter((q) => q.enabled)
    .sort((a, b) => a.order - b.order)
    .filter((q) => isVisible(q, answers));
}

export function isAnswered(q: Question, value: AnswerValue | undefined): boolean {
  const required = q.required ?? (q.type !== 'text' && q.type !== 'tags');
  if (!required) return true;
  switch (q.type) {
    case 'single':
      return typeof value === 'string' && value.length > 0;
    case 'multi':
    case 'multiSelect':
    case 'ranking':
      return Array.isArray(value) && value.length >= (q.min ?? 1);
    case 'tags':
      return Array.isArray(value) && value.length >= (q.min ?? 0);
    case 'scale':
      return typeof value === 'number' && Number.isFinite(value);
    case 'text':
      return typeof value === 'string' && value.trim().length > 0;
    default:
      return false;
  }
}

function tokens(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// ---------------------------------------------------------------------------
// User dimension profile (0–100 per dimension).
// ---------------------------------------------------------------------------

function computeProfile(questions: Question[], answers: Answers): Record<Dimension, number> {
  const raw: Record<string, number> = {};
  const max: Record<string, number> = {};
  const add = (m: Record<string, number>, d: string, v: number) => (m[d] = (m[d] ?? 0) + v);

  for (const q of questions) {
    const a = answers[q.id];

    if (q.type === 'scale' && q.dimension && q.scale) {
      const val = typeof a === 'number' ? a : q.scale.min;
      add(raw, q.dimension, val - q.scale.min);
      add(max, q.dimension, q.scale.max - q.scale.min);
      continue;
    }
    if (!q.options) continue;

    if (q.type === 'single') {
      const perMax: Record<string, number> = {};
      for (const o of q.options) for (const [d, v] of Object.entries(o.dimensions ?? {})) perMax[d] = Math.max(perMax[d] ?? 0, v);
      for (const [d, v] of Object.entries(perMax)) add(max, d, v);
      const sel = q.options.find((o) => o.value === a);
      if (sel) for (const [d, v] of Object.entries(sel.dimensions ?? {})) add(raw, d, v);
    } else if (q.type === 'multi' || q.type === 'multiSelect') {
      // "A couple of strong picks is enough": cap max at 2× the best option.
      const perBest: Record<string, number> = {};
      for (const o of q.options) for (const [d, v] of Object.entries(o.dimensions ?? {})) perBest[d] = Math.max(perBest[d] ?? 0, v);
      for (const [d, v] of Object.entries(perBest)) add(max, d, v * 2);
      const arr = asArray(a);
      const acc: Record<string, number> = {};
      for (const o of q.options) if (arr.includes(o.value)) for (const [d, v] of Object.entries(o.dimensions ?? {})) acc[d] = (acc[d] ?? 0) + v;
      for (const [d, v] of Object.entries(acc)) add(raw, d, Math.min(v, (perBest[d] ?? 0) * 2));
    }
  }

  const out = {} as Record<Dimension, number>;
  for (const { id } of DIMENSIONS) out[id] = max[id] ? clamp((raw[id] ?? 0) / max[id] * 100) : 0;
  return out;
}

// ---------------------------------------------------------------------------
// Category / niche affinity from the answers.
// ---------------------------------------------------------------------------

function computeAffinity(questions: Question[], answers: Answers) {
  const cat: Record<string, number> = {};
  const nicheKw: Record<string, number> = {};
  const add = (m: Record<string, number>, k: string, v: number) => (m[k] = (m[k] ?? 0) + v);

  for (const q of questions) {
    const a = answers[q.id];
    if (q.options && (q.type === 'single' || q.type === 'multi' || q.type === 'multiSelect')) {
      const sel = asArray(a);
      for (const o of q.options) {
        if (!sel.includes(o.value)) continue;
        for (const [c, v] of Object.entries(o.categories ?? {})) add(cat, c, v);
        for (const [n, v] of Object.entries(o.niches ?? {})) add(nicheKw, n, v);
      }
    } else if (q.type === 'ranking' && q.options) {
      const order = asArray(a);
      order.forEach((val, i) => {
        const o = q.options!.find((x) => x.value === val);
        if (!o) return;
        const weight = Math.max(1, order.length - i) / order.length; // 1 → top
        for (const [c, v] of Object.entries(o.categories ?? {})) add(cat, c, v * weight);
      });
    }
  }

  // Free-text + tags keyword overlap → niche-level affinity.
  const kw = [
    ...tokens(typeof answers['experience-result'] === 'string' ? (answers['experience-result'] as string) : ''),
    ...asArray(answers['knowledge-tags']).flatMap((t) => tokens(t)),
  ];
  if (kw.length) {
    for (const n of niches) {
      const hay = new Set([...n.keywords, ...tokens(n.subNiches.join(' ')), ...tokens(n.title)]);
      const hits = kw.filter((t) => hay.has(t)).length;
      if (hits) add(nicheKw, n.id, hits * 3);
    }
  }
  return { cat, nicheKw };
}

const levelFromScore = (n: number): Level => (n < 40 ? 'Low' : n < 60 ? 'Medium' : n < 80 ? 'High' : 'Very High');

// ---------------------------------------------------------------------------
// Per-niche recommendation builder.
// ---------------------------------------------------------------------------

function buildRecommendation(
  niche: Niche,
  matchScore: number,
  profile: Record<Dimension, number>,
  chosenAudience: string | null,
  weights: ScoringWeights,
): NicheRecommendation {
  const market = marketFor(niche);
  const content = contentFor(niche);

  const readiness = clamp((profile.skill * 0.35 + profile.experience * 0.3 + profile.knowledge * 0.2 + profile.model * 0.15));

  const passionScore = clamp(profile.passion * 0.6 + matchScore * 0.4);
  const skillMatch = clamp(profile.skill * 0.4 + profile.experience * 0.25 + profile.knowledge * 0.2 + matchScore * 0.15);
  const profitabilityScore = clamp(market.profitability + (profile.income - 50) * 0.15);
  const demandScore = clamp(market.demand * 0.85 + (profile.demand - 50) * 0.15 + 8);
  const competitionScore = market.competition;
  const difficultyScore = clamp(market.difficulty - (readiness - 50) * 0.2);

  // Explainable weighted composite.
  const breakdown = [
    { label: 'Interest match', value: matchScore, weight: weights.match },
    { label: 'Passion fit', value: passionScore, weight: weights.passion },
    { label: 'Skill match', value: skillMatch, weight: weights.skill },
    { label: 'Profitability', value: profitabilityScore, weight: weights.profitability },
    { label: 'Demand', value: demandScore, weight: weights.demand },
    { label: 'Low competition', value: 100 - competitionScore, weight: weights.competition },
  ].map((b) => ({ ...b, contribution: Math.round(b.value * b.weight) }));

  const nicheScore = clamp(
    breakdown.reduce((s, b) => s + b.value * b.weight, 0) - Math.max(0, difficultyScore - 55) * weights.difficultyPenalty,
  );

  // Revenue potential scaled by income ambition + whether a scalable model is
  // favoured. The knowledge base authors these bands in USD; they are display
  // figures only (nothing scores on them), so they are converted to INR here
  // rather than shown with a swapped symbol. Scaling maths is unchanged.
  const scaleFactor = 0.7 + (profile.income / 100) * 0.6 + (profile.model / 100) * 0.2;
  const low = usdToInr(market.revenue.low * (0.6 + (profile.income / 100) * 0.4), 5000);
  const high = usdToInr(market.revenue.high * scaleFactor, 5000);
  const revLabel = levelFromScore(profitabilityScore);

  const audienceStr = chosenAudience ? `${cap(chosenAudience)} — ${content.audience}` : content.audience;

  const { strengths, weaknesses } = strengthsWeaknesses(profile, market, readiness);

  return {
    nicheId: niche.id,
    categoryId: niche.categoryId,
    title: niche.title,
    categoryName: categoryName(niche.categoryId),
    tagline: content.positioning,
    summary: niche.blurb,
    subNiches: niche.subNiches,

    nicheScore,
    confidenceScore: 0, // filled by caller (needs cross-niche separation)
    profitabilityScore,
    passionScore,
    skillMatch,
    demandScore,
    competitionLevel: levelFromScore(competitionScore),
    competitionScore,
    difficultyLevel: levelFromScore(difficultyScore),
    difficultyScore,

    revenuePotential: {
      low,
      high,
      label: `${revLabel} · ${formatINRRange(low, high)}/mo`,
      note: 'Editorial estimate for an established solo coach; scaled to your income goal and model.',
    },

    scoreBreakdown: breakdown,

    targetAudience: audienceStr,
    positioning: content.positioning,
    uvp: content.uvp,
    businessOpportunities: content.opportunities,
    contentPillars: content.contentPillars,
    offerIdeas: personalizeOffers(content.offers, profile),
    productIdeas: content.products,
    communityIdeas: content.community,
    pricingSuggestions: content.pricing,
    marketingSuggestions: personalizeMarketing(content.marketing, profile),
    funnelRecommendation: funnelFor(profile),
    growthRoadmap: roadmapFor(niche),
    actionPlan90Day: actionPlanFor(niche),

    strengths,
    weaknesses,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function strengthsWeaknesses(profile: Record<Dimension, number>, market: { competition: number; difficulty: number }, readiness: number) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const labelOf = (d: Dimension) => DIMENSIONS.find((x) => x.id === d)!.label;
  const entries = DIMENSIONS.map((d) => ({ d: d.id, v: profile[d.id] }));
  entries.sort((a, b) => b.v - a.v);
  for (const e of entries.slice(0, 3)) if (e.v >= 55) strengths.push(`Strong ${labelOf(e.d).toLowerCase()} (${e.v}/100)`);
  for (const e of entries.slice(-3).reverse()) if (e.v <= 45) weaknesses.push(`Room to grow ${labelOf(e.d).toLowerCase()} (${e.v}/100)`);
  if (readiness < 45) weaknesses.push('Selling confidence still building — start with a small pilot offer');
  if (market.competition >= 78) weaknesses.push('Competitive space — a sharp, specific angle is essential');
  if (market.competition <= 55) strengths.push('Less crowded space — easier to stand out early');
  if (!strengths.length) strengths.push('Balanced profile — flexible across several angles');
  if (!weaknesses.length) weaknesses.push('No major gaps — focus on shipping and getting reps');
  return { strengths: strengths.slice(0, 4), weaknesses: weaknesses.slice(0, 4) };
}

function personalizeOffers(base: string[], profile: Record<Dimension, number>): string[] {
  const out = [...base];
  if (profile.income >= 65) out.unshift('Premium high-ticket 1:1 package (your income goal favours this)');
  if (profile.model >= 65) out.push('Scalable group cohort or membership to leverage your time');
  return out.slice(0, 4);
}

function personalizeMarketing(base: string[], profile: Record<Dimension, number>): string[] {
  const out = [...base];
  if (profile.audience >= 60) out.unshift('Lean into the channel your audience already uses daily');
  return out.slice(0, 4);
}

function funnelFor(profile: Record<Dimension, number>): string[] {
  if (profile.model >= 60 || profile.income >= 65) {
    return [
      'Lead magnet (free guide / mini-assessment) → email list',
      'Nurture sequence teaching one core idea',
      'Webinar or challenge → group program offer',
      'Application call for high-ticket 1:1',
    ];
  }
  return [
    'Simple lead magnet → email list',
    '3–5 email welcome sequence with a quick win',
    'Soft pitch a starter offer',
    'Book discovery calls from warm replies',
  ];
}

function roadmapFor(niche: Niche): { phase: string; focus: string }[] {
  return [
    { phase: 'Phase 1 · Foundation (Weeks 1–4)', focus: `Define your ${niche.title} promise, offer and ideal client. Publish 8 pieces of content.` },
    { phase: 'Phase 2 · First clients (Weeks 5–8)', focus: 'Run a small pilot with 2–3 clients at an intro price. Collect results and testimonials.' },
    { phase: 'Phase 3 · Systemize (Months 3–4)', focus: 'Package a repeatable program, set real pricing, and build a simple lead funnel.' },
    { phase: 'Phase 4 · Scale (Months 5–6)', focus: 'Introduce a group or digital product to leverage time and grow beyond 1:1.' },
  ];
}

function actionPlanFor(niche: Niche): { window: string; goal: string; steps: string[] }[] {
  const first = niche.subNiches[0] ?? niche.title;
  return [
    {
      window: 'Days 1–30 · Clarity & proof',
      goal: 'Lock your niche and get your first conversations.',
      steps: [
        `Write a one-line promise: "I help [who] achieve [${first.toLowerCase()}]".`,
        'Publish 3× per week on one channel.',
        'Have 5 conversations with your ideal client.',
      ],
    },
    {
      window: 'Days 31–60 · First offer',
      goal: 'Design and sell a simple starter offer.',
      steps: [
        'Package a 4-week outcome-focused offer.',
        'Invite 3 people to a discounted pilot.',
        'Deliver, gather feedback, capture a testimonial.',
      ],
    },
    {
      window: 'Days 61–90 · Momentum',
      goal: 'Turn proof into a repeatable system.',
      steps: [
        'Raise your price and refine the offer.',
        'Set up a lead magnet + email capture.',
        'Aim for 3–5 paying clients or your first cohort.',
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Public entry point.
// ---------------------------------------------------------------------------

export interface AnalyzeOptions {
  uid?: string | null;
  offline?: boolean;
  weights?: ScoringWeights;
}

export function analyze(questions: Question[], answers: Answers, opts: AnalyzeOptions = {}): AnalysisResult {
  const weights = opts.weights ?? DEFAULT_WEIGHTS;
  const visible = visibleQuestions(questions, answers);
  const profile = computeProfile(visible, answers);
  const { cat, nicheKw } = computeAffinity(visible, answers);

  const chosenAudience = typeof answers['audience-who'] === 'string' ? (answers['audience-who'] as string) : null;

  // Raw affinity per niche, then normalise to a 0–100 match score.
  const affinityRaw = niches.map((n) => ({ n, raw: (cat[n.categoryId] ?? 0) + (nicheKw[n.id] ?? 0) }));
  const bestRaw = Math.max(1, ...affinityRaw.map((x) => x.raw));
  const anySignal = affinityRaw.some((x) => x.raw > 0);

  const recs = affinityRaw.map(({ n, raw }) => {
    const matchScore = clamp((raw / bestRaw) * 90 + 8);
    return buildRecommendation(n, matchScore, profile, chosenAudience, weights);
  });

  recs.sort((a, b) => b.nicheScore - a.nicheScore || b.demandScore - a.demandScore);
  const top = recs.slice(0, 5);

  // Confidence uses answer completeness + separation between #1 and #2.
  const required = visible.filter((q) => (q.required ?? (q.type !== 'text' && q.type !== 'tags')));
  const answeredRatio = required.length ? required.filter((q) => isAnswered(q, answers[q.id])).length / required.length : 0;
  const separation = top.length >= 2 ? Math.min(20, Math.max(0, top[0].nicheScore - top[1].nicheScore)) : 12;
  top.forEach((r, i) => {
    r.confidenceScore = clamp(46 + answeredRatio * 24 + (i === 0 ? separation : separation * 0.6) + (r.skillMatch - 50) * 0.15);
  });

  const headline = top[0];
  const insights = buildInsights(profile, top);
  const actionSteps = headline
    ? [
        `Commit to "${headline.title}" for the next 90 days — depth beats dabbling.`,
        `Write your one-line promise using your UVP: ${headline.uvp}`,
        headline.actionPlan90Day[0].steps[1],
        'Publish your first piece of content this week.',
      ]
    : ['Answer a few more questions to sharpen your recommendations.'];

  return {
    id: `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    uid: opts.uid ?? null,
    createdAt: new Date().toISOString(),
    headlineScore: headline?.nicheScore ?? 0,
    headlineConfidence: headline?.confidenceScore ?? 0,
    summary: headline
      ? `Your strongest fit is ${headline.title} in ${headline.categoryName} — a ${headline.competitionLevel.toLowerCase()}-competition space with ${headline.demandScore}/100 demand.`
      : 'We need a little more signal to recommend a niche.',
    recommendations: top,
    profile,
    insights,
    actionSteps,
    meta: {
      weak: !anySignal,
      answered: required.filter((q) => isAnswered(q, answers[q.id])).length,
      engine: opts.offline ? 'coachx-intelligence-offline' : 'coachx-intelligence',
    },
  };
}

function buildInsights(profile: Record<Dimension, number>, top: NicheRecommendation[]): string[] {
  const labelOf = (d: Dimension) => DIMENSIONS.find((x) => x.id === d)!.label;
  const sorted = DIMENSIONS.map((d) => ({ d: d.id, v: profile[d.id] })).sort((a, b) => b.v - a.v);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const out: string[] = [];
  if (top[0]) out.push(`Your answers point most strongly to ${top[0].title} — it balances your passion, skills and the market.`);
  out.push(`Your biggest asset is ${labelOf(strongest.d).toLowerCase()} (${strongest.v}/100). Build your positioning around it.`);
  out.push(`Your biggest growth lever is ${labelOf(weakest.d).toLowerCase()} (${weakest.v}/100) — a small investment here compounds fast.`);
  if (profile.income >= 65) out.push('Your income goal is ambitious — prioritise high-ticket and leveraged offers over hourly work.');
  if (profile.demand >= 60) out.push('You value proven demand, so we weighted market size and profitability more heavily in your ranking.');
  if (top[1]) out.push(`Keep ${top[1].title} as a strong plan B — it is a close second and shares much of your skill set.`);
  return out.slice(0, 5);
}
