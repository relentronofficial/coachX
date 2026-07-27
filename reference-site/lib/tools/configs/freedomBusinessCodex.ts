import type { ToolConfig, Answers } from '../types';
import { scoreDimensions, overallOf, levelBand } from '../engine';

/**
 * Freedom Business Codex — ORIGINAL business-model readiness blueprint across
 * four pillars (Niche, Offer, Audience, Systems). Original questions/scoring.
 */

const PILLARS = [
  { id: 'niche', label: 'Niche Clarity' },
  { id: 'offer', label: 'Offer' },
  { id: 'audience', label: 'Audience' },
  { id: 'systems', label: 'Systems' },
];

const w = (d: string, n: number): Record<string, number> => ({ [d]: n });

export const freedomBusinessCodex: ToolConfig = {
  slug: 'freedom-business-codex',
  name: 'Freedom Business Codex',
  category: 'Planning',
  icon: '🧭',
  tagline: 'Blueprint your coaching business',
  description: 'Answer a few questions to see how ready your business model is — and what to fix first.',
  origin: 'original-equivalent',
  estMinutes: 4,
  start: {
    headline: 'Blueprint your Freedom Business',
    sub: 'A quick readiness check across the four pillars of a coaching business that runs without you.',
    bullets: ['~4 minutes', 'Pillar-by-pillar score', 'Get your next actions'],
  },
  dimensions: PILLARS,
  steps: [
    {
      id: 'niche',
      type: 'single',
      title: 'How clear is your niche?',
      options: [
        { value: '1', label: 'Still exploring topics', scores: w('niche', 1) },
        { value: '2', label: 'I have a broad area', scores: w('niche', 2) },
        { value: '3', label: 'A clear topic and audience', scores: w('niche', 4) },
        { value: '4', label: 'A specific, in-demand niche I own', scores: w('niche', 6) },
      ],
    },
    {
      id: 'offer',
      type: 'single',
      title: 'What does your offer look like?',
      options: [
        { value: '1', label: 'No offer yet', scores: w('offer', 1) },
        { value: '2', label: 'An idea, not packaged', scores: w('offer', 2) },
        { value: '3', label: 'A packaged offer with a price', scores: w('offer', 4) },
        { value: '4', label: 'A proven offer people buy', scores: w('offer', 6) },
      ],
    },
    {
      id: 'audience',
      type: 'single',
      title: 'How is your audience?',
      options: [
        { value: '1', label: 'Starting from zero', scores: w('audience', 1) },
        { value: '2', label: 'A small following', scores: w('audience', 2) },
        { value: '3', label: 'A growing, engaged audience', scores: w('audience', 4) },
        { value: '4', label: 'A steady flow of leads', scores: w('audience', 6) },
      ],
    },
    {
      id: 'leadflow',
      type: 'single',
      title: 'How do new leads find you today?',
      options: [
        { value: '1', label: 'They mostly don’t yet', scores: w('audience', 1) },
        { value: '2', label: 'Occasional referrals', scores: w('audience', 3) },
        { value: '3', label: 'One channel that works', scores: w('audience', 5) },
      ],
    },
    {
      id: 'systems',
      type: 'single',
      title: 'How systemised is delivery?',
      options: [
        { value: '1', label: 'Everything is manual', scores: w('systems', 1) },
        { value: '2', label: 'A few templates', scores: w('systems', 2) },
        { value: '3', label: 'Repeatable processes', scores: w('systems', 4) },
        { value: '4', label: 'Automated and scalable', scores: w('systems', 6) },
      ],
    },
    {
      id: 'time',
      type: 'single',
      title: 'If you stopped working for a month, revenue would…',
      options: [
        { value: '1', label: 'Stop completely', scores: w('systems', 1) },
        { value: '2', label: 'Drop a lot', scores: w('systems', 3) },
        { value: '3', label: 'Mostly keep going', scores: w('systems', 5) },
      ],
    },
  ],
  score: (answers: Answers) => {
    const dim = scoreDimensions(freedomBusinessCodex.steps, answers);
    const NOTES: Record<string, (s: number) => string> = {
      niche: (s) => (s >= 66 ? 'Clear and specific — great foundation.' : s >= 40 ? 'Getting there — tighten who it’s for.' : 'Your #1 priority: pick a focused niche.'),
      offer: (s) => (s >= 66 ? 'A real, sellable offer.' : s >= 40 ? 'Package it with a clear price and promise.' : 'Turn your knowledge into one simple offer.'),
      audience: (s) => (s >= 66 ? 'Leads are flowing.' : s >= 40 ? 'Pick one channel and be consistent.' : 'Build a repeatable way to attract leads.'),
      systems: (s) => (s >= 66 ? 'Scalable and resilient.' : s >= 40 ? 'Templatise the repetitive parts.' : 'Document and automate delivery.'),
    };
    const pillars = PILLARS.map((p) => ({ id: p.id, label: p.label, score: dim[p.id] ?? 0, note: NOTES[p.id](dim[p.id] ?? 0) }));
    const overall = overallOf(dim, PILLARS.map((p) => p.id));
    const { level } = levelBand(overall, [
      { min: 75, level: 'Scale-ready', blurb: '' },
      { min: 50, level: 'Growth-ready', blurb: '' },
      { min: 30, level: 'Foundation', blurb: '' },
      { min: 0, level: 'Idea', blurb: '' },
    ]);
    const weakest = [...pillars].sort((a, b) => a.score - b.score)[0];
    const ACTIONS: Record<string, string[]> = {
      niche: ['Use the Niche Finder to lock a focused niche', 'Write a one-line “I help X do Y” statement'],
      offer: ['Package one outcome into a simple offer', 'Set a clear price and promise'],
      audience: ['Choose one channel and post consistently', 'Create a lead magnet to capture emails'],
      systems: ['Templatise onboarding & follow-up', 'Automate one manual step this week'],
    };
    return {
      kind: 'blueprint',
      overall,
      readiness: level,
      pillars,
      actions: ACTIONS[weakest.id] ?? ['Focus on your weakest pillar first'],
    };
  },
};
