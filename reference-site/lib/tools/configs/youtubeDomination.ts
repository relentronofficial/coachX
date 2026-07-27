import type { ToolConfig, Answers, Question } from '../types';
import { scoreDimensions, overallOf, levelBand } from '../engine';

/**
 * YouTube Domination Codex — ORIGINAL readiness scorecard for growing a
 * coaching channel on YouTube. Original questions, scoring and plan.
 */

const DIMS = [
  { id: 'positioning', label: 'Positioning' },
  { id: 'content', label: 'Content & Hooks' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'optimization', label: 'Titles & Thumbnails' },
  { id: 'conversion', label: 'Channel → Business' },
];

const scale = (id: string, dimension: string, title: string): Question => ({
  id,
  type: 'scale',
  dimension,
  title,
  scale: { min: 1, max: 5, minLabel: 'Not yet', maxLabel: 'Dialled in', step: 1 },
});

export const youtubeDomination: ToolConfig = {
  slug: 'youtube-domination',
  name: 'YouTube Domination Codex',
  category: 'Marketing',
  icon: '📺',
  tagline: 'Assess your YouTube growth readiness',
  description: 'Score your channel across five growth levers and get your next move.',
  origin: 'original-equivalent',
  estMinutes: 4,
  start: {
    headline: 'Are you ready to grow on YouTube?',
    sub: 'Score your channel across the five levers that actually drive coaching growth on YouTube.',
    bullets: ['~4 minutes', 'See your weakest lever', 'Get a focused next step'],
  },
  dimensions: DIMS,
  steps: [
    scale('p1', 'positioning', 'My channel clearly speaks to one specific viewer.'),
    scale('c1', 'content', 'My videos hook viewers in the first 15 seconds.'),
    scale('c2', 'content', 'My topics are things my ideal client actively searches for.'),
    scale('k1', 'consistency', 'I publish on a predictable schedule.'),
    scale('o1', 'optimization', 'My titles and thumbnails earn the click.'),
    scale('v1', 'conversion', 'My videos guide viewers toward working with me.'),
  ],
  score: (answers: Answers) => {
    const dim = scoreDimensions(youtubeDomination.steps, answers);
    const dimensions = DIMS.map((d) => ({ id: d.id, label: d.label, score: dim[d.id] ?? 0 }));
    const overall = overallOf(dim, DIMS.map((d) => d.id));
    const { level, blurb } = levelBand(overall, [
      { min: 80, level: 'Authority', blurb: 'Your channel is set up to compound — double down and scale.' },
      { min: 60, level: 'Momentum', blurb: 'Good foundations — sharpen your weakest lever to accelerate.' },
      { min: 40, level: 'Foundational', blurb: 'You’re on the board — pick one lever and improve it deliberately.' },
      { min: 0, level: 'Launch', blurb: 'Early stage — nail positioning and hooks before anything else.' },
    ]);
    const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
    const REC: Record<string, string[]> = {
      positioning: ['Write a one-line channel promise for one viewer', 'Audit your last 5 videos for focus'],
      content: ['Script 3 stronger 15-second hooks', 'Research 10 search-driven topics'],
      consistency: ['Batch a month of ideas', 'Commit to one realistic weekly slot'],
      optimization: ['A/B test two thumbnail styles', 'Rewrite titles around curiosity + clarity'],
      conversion: ['Add a clear call-to-action + free tool link', 'Point videos to your Niche Finder or workshop'],
    };
    const strengths = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 2).filter((d) => d.score >= 50).map((d) => `${d.label} (${d.score}%)`);
    return {
      kind: 'scorecard',
      overall,
      level,
      levelBlurb: blurb,
      dimensions,
      strengths: strengths.length ? strengths : ['Every lever is an opportunity right now'],
      gaps: [`${weakest.label} is your biggest lever (${weakest.score}%)`],
      recommendations: REC[weakest.id] ?? ['Focus on your lowest-scoring lever first'],
    };
  },
};
