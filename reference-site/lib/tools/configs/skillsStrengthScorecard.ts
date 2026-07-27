import type { ToolConfig, Answers, Question } from '../types';
import { scoreDimensions, overallOf, levelBand } from '../engine';

/**
 * Skills Strength Scorecard — ORIGINAL self-assessment across five coaching-
 * business skill areas, using 1–5 scale questions. Produces a scorecard with
 * strengths, gaps and a focus plan. (Original content; not copied.)
 */

const DIMS = [
  { id: 'content', label: 'Content & Teaching' },
  { id: 'marketing', label: 'Marketing & Audience' },
  { id: 'sales', label: 'Sales & Conversion' },
  { id: 'delivery', label: 'Coaching & Delivery' },
  { id: 'systems', label: 'Systems & Operations' },
];

const scale = (id: string, dimension: string, title: string): Question => ({
  id,
  type: 'scale',
  dimension,
  title,
  scale: { min: 1, max: 5, minLabel: 'Not yet', maxLabel: 'Very strong', step: 1 },
});

export const skillsStrengthScorecard: ToolConfig = {
  slug: 'skills-strength-scorecard',
  name: 'Skills Strength Scorecard',
  category: 'Assessment',
  icon: '📊',
  tagline: 'Score your coaching-business skills',
  description: 'Rate yourself across five key areas and get a focus plan for the biggest gap.',
  origin: 'original-equivalent',
  estMinutes: 4,
  start: {
    headline: 'Score your coaching skills',
    sub: 'Rate yourself across five areas that decide how fast your coaching business grows.',
    bullets: ['~4 minutes', 'See strengths & gaps', 'Get a focus plan'],
  },
  dimensions: DIMS,
  steps: [
    scale('c1', 'content', 'I can explain my topic simply and make it click.'),
    scale('c2', 'content', 'I consistently create content people find valuable.'),
    scale('m1', 'marketing', 'I know how to attract the right audience.'),
    scale('m2', 'marketing', 'I have a repeatable way to generate leads.'),
    scale('s1', 'sales', 'I’m comfortable making offers and talking about price.'),
    scale('s2', 'sales', 'I convert conversations into paying clients.'),
    scale('d1', 'delivery', 'My clients get real results from working with me.'),
    scale('sy1', 'systems', 'I have systems so delivery doesn’t depend on me being online.'),
  ],
  score: (answers: Answers) => {
    const dim = scoreDimensions(skillsStrengthScorecard.steps, answers);
    const dimensions = DIMS.map((d) => ({ id: d.id, label: d.label, score: dim[d.id] ?? 0 }));
    const overall = overallOf(dim, DIMS.map((d) => d.id));
    const { level, blurb } = levelBand(overall, [
      { min: 80, level: 'Scaling', blurb: 'Strong across the board — focus on leverage and systems to scale.' },
      { min: 60, level: 'Growing', blurb: 'A solid base with clear areas to sharpen next.' },
      { min: 40, level: 'Building', blurb: 'The foundations are forming — pick one gap and go deep.' },
      { min: 0, level: 'Starting', blurb: 'Early days — focus on one area at a time and build momentum.' },
    ]);
    const sorted = [...dimensions].sort((a, b) => b.score - a.score);
    const strengths = sorted.slice(0, 2).filter((d) => d.score >= 50).map((d) => `${d.label} is a strength (${d.score}%)`);
    const gaps = [...dimensions].sort((a, b) => a.score - b.score).slice(0, 2).map((d) => `${d.label} needs focus (${d.score}%)`);
    const weakest = [...dimensions].sort((a, b) => a.score - b.score)[0];
    const REC: Record<string, string[]> = {
      content: ['Publish one teaching post a week', 'Turn your best content into a lead magnet'],
      marketing: ['Define your one ideal client', 'Pick a single channel and stay consistent'],
      sales: ['Write a simple, clear offer', 'Practice a low-pressure sales conversation'],
      delivery: ['Document a repeatable client result path', 'Collect outcomes and testimonials'],
      systems: ['Templatise onboarding and follow-up', 'Automate one manual task this week'],
    };
    return {
      kind: 'scorecard',
      overall,
      level,
      levelBlurb: blurb,
      dimensions,
      strengths: strengths.length ? strengths : ['Keep building — every area has room to grow'],
      gaps,
      recommendations: REC[weakest.id] ?? ['Pick your lowest area and focus there for 30 days'],
    };
  },
};
