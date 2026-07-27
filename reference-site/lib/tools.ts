/**
 * Tools registry for the /tools index.
 *
 * `origin` is honest about provenance:
 *   - 'public-observed'    : the tool's public workflow was observed (Niche Finder).
 *   - 'original-equivalent': same product category as a member-gated reference
 *                            tool, but built entirely original (questions,
 *                            scoring, report). No gated content was accessed.
 *   - 'original'           : an original CoachX addition (Revenue Calculator).
 */
export type ToolOrigin = 'public-observed' | 'original-equivalent' | 'original';

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  category: string;
  origin: ToolOrigin;
  href: string;
  icon: string;
}

/** The seven required tools — all fully functional. */
export const tools: ToolMeta[] = [
  {
    slug: 'ai-niche-finder',
    name: 'AI Niche Finder',
    description: 'Enterprise AI assessment: rank your best-fit niches with a full 24-point intelligence report, charts and a 90-day plan.',
    category: 'Clarity',
    origin: 'original',
    href: '/niche-finder',
    icon: '🧠',
  },
  {
    slug: 'niche-finder',
    name: 'Niche Finder',
    description: 'Answer a few questions and get your best-fit coaching niches, ranked with reasons.',
    category: 'Clarity',
    origin: 'public-observed',
    href: '/tools/niche-finder',
    icon: '🧭',
  },
  {
    slug: 'personal-codex',
    name: 'My Personal Codex',
    description: 'Reveal your natural working persona — how you create, teach, connect or strategise.',
    category: 'Clarity',
    origin: 'original-equivalent',
    href: '/tools/personal-codex',
    icon: '📜',
  },
  {
    slug: 'coach-persona-codex',
    name: 'Coach Persona Codex',
    description: 'Identify your natural coaching style and how to play to its strengths.',
    category: 'Assessment',
    origin: 'original-equivalent',
    href: '/tools/coach-persona-codex',
    icon: '🎭',
  },
  {
    slug: 'freedom-business-codex',
    name: 'Freedom Business Codex',
    description: 'Blueprint your coaching business across four pillars and get your next actions.',
    category: 'Planning',
    origin: 'original-equivalent',
    href: '/tools/freedom-business-codex',
    icon: '🧱',
  },
  {
    slug: 'skills-strength-scorecard',
    name: 'Skills Strength Scorecard',
    description: 'Rate yourself across five skill areas and get a focus plan for the biggest gap.',
    category: 'Assessment',
    origin: 'original-equivalent',
    href: '/tools/skills-strength-scorecard',
    icon: '📊',
  },
  {
    slug: 'viral-reels-challenge',
    name: 'Viral Reels Challenge',
    description: 'A 5-day guided challenge to publish a standout reel. Your progress is saved.',
    category: 'Marketing',
    origin: 'original-equivalent',
    href: '/tools/viral-reels-challenge',
    icon: '🎬',
  },
  {
    slug: 'youtube-domination',
    name: 'YouTube Domination Codex',
    description: 'Score your channel across five growth levers and get your next move.',
    category: 'Marketing',
    origin: 'original-equivalent',
    href: '/tools/youtube-domination',
    icon: '📺',
  },
];

/** Original bonus tool (kept from earlier), shown separately. */
export const bonusTools: ToolMeta[] = [
  {
    slug: 'revenue-calculator',
    name: 'Revenue Calculator',
    description: 'Model clients, pricing and conversion to project your monthly and yearly revenue.',
    category: 'Growth',
    origin: 'original',
    href: '/tools/revenue-calculator',
    icon: '🧮',
  },
];

export const allTools = [...tools, ...bonusTools];

export function toolBySlug(slug: string): ToolMeta | undefined {
  return allTools.find((t) => t.slug === slug);
}
