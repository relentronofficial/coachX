import type { ToolConfig, Answers } from '../types';
import { scoreDimensions } from '../engine';

/**
 * Coach Persona Codex — ORIGINAL assessment of your natural coaching style,
 * mapping to one of four coaching archetypes. (Member-gated equivalent on the
 * reference site was not accessed; all content here is our own.)
 */

const DIMS = ['guide', 'challenger', 'nurturer', 'expert'] as const;
type CDim = (typeof DIMS)[number];

const PERSONAS: Record<CDim, { title: string; tagline: string; blurb: string; strengths: string[]; watchouts: string[]; recommendations: string[] }> = {
  guide: {
    title: 'The Guide',
    tagline: 'You walk beside your clients and ask the right questions',
    blurb: 'You coach with curiosity and structure, helping clients find their own answers.',
    strengths: ['Powerful questions', 'Creates safety and momentum', 'Client-led breakthroughs'],
    watchouts: ['Can be too hands-off for beginners', 'May avoid giving direct advice'],
    recommendations: ['Add a clear framework so progress feels tangible', 'Package your process into a program'],
  },
  challenger: {
    title: 'The Challenger',
    tagline: 'You push clients past their comfort zone',
    blurb: 'You hold a high standard and drive accountability. Clients get results with you.',
    strengths: ['Drives accountability', 'Cuts through excuses', 'Results-focused'],
    watchouts: ['Can feel intense for some clients', 'Watch for burnout — theirs and yours'],
    recommendations: ['Balance challenge with encouragement', 'Use milestones to celebrate wins'],
  },
  nurturer: {
    title: 'The Nurturer',
    tagline: 'You create trust and lasting transformation',
    blurb: 'Empathy is your edge. Clients feel deeply supported and stay for the long term.',
    strengths: ['High empathy and retention', 'Builds deep trust', 'Great for sensitive topics'],
    watchouts: ['Can under-charge', 'May avoid pushing when needed'],
    recommendations: ['Add firmer structure and boundaries', 'Price for the transformation you create'],
  },
  expert: {
    title: 'The Expert',
    tagline: 'You lead with deep knowledge and clear methods',
    blurb: 'You teach a proven method and clients trust your authority.',
    strengths: ['Clear frameworks', 'Strong authority', 'Great for skills-based coaching'],
    watchouts: ['Can over-teach and under-coach', 'Risk of one-size-fits-all'],
    recommendations: ['Leave room for the client’s context', 'Turn your method into signature IP'],
  },
};

const w = (d: CDim, n = 2): Record<string, number> => ({ [d]: n });

export const coachPersonaCodex: ToolConfig = {
  slug: 'coach-persona-codex',
  name: 'Coach Persona Codex',
  category: 'Assessment',
  icon: '🎭',
  tagline: 'Identify your natural coaching style',
  description: 'Find your coaching archetype and how to play to its strengths.',
  origin: 'original-equivalent',
  estMinutes: 3,
  start: {
    headline: 'Find your Coach Persona',
    sub: 'Understand your natural coaching style so you can lean into what makes you effective.',
    bullets: ['~3 minutes', 'Get your archetype', 'Strengths, watch-outs & next steps'],
  },
  dimensions: DIMS.map((id) => ({ id, label: PERSONAS[id].title })),
  steps: [
    {
      id: 'session',
      type: 'single',
      title: 'In a session, you mostly…',
      options: [
        { value: 'g', label: 'Ask questions that unlock their thinking', scores: w('guide') },
        { value: 'c', label: 'Hold them to their commitments', scores: w('challenger') },
        { value: 'n', label: 'Listen and make them feel safe', scores: w('nurturer') },
        { value: 'e', label: 'Teach the right method to use', scores: w('expert') },
      ],
    },
    {
      id: 'client-stuck',
      type: 'single',
      title: 'A client is stuck. Your move?',
      options: [
        { value: 'g', label: 'Explore what’s really going on', scores: w('guide') },
        { value: 'c', label: 'Challenge the story they’re telling', scores: w('challenger') },
        { value: 'n', label: 'Reassure and rebuild confidence', scores: w('nurturer') },
        { value: 'e', label: 'Show them the exact next step', scores: w('expert') },
      ],
    },
    {
      id: 'feedback',
      type: 'single',
      title: 'Clients thank you most for…',
      options: [
        { value: 'g', label: 'Helping them find their own answers', scores: w('guide') },
        { value: 'c', label: 'Not letting them settle', scores: w('challenger') },
        { value: 'n', label: 'Believing in them', scores: w('nurturer') },
        { value: 'e', label: 'Your clarity and expertise', scores: w('expert') },
      ],
    },
    {
      id: 'energy',
      type: 'single',
      title: 'What energises you as a coach?',
      options: [
        { value: 'g', label: 'The “aha” moment', scores: w('guide') },
        { value: 'c', label: 'Seeing real results fast', scores: w('challenger') },
        { value: 'n', label: 'Deep, lasting change', scores: w('nurturer') },
        { value: 'e', label: 'Sharing what you’ve mastered', scores: w('expert') },
      ],
    },
    {
      id: 'style',
      type: 'multi',
      min: 1,
      title: 'Which describe your style?',
      help: 'Pick all that apply.',
      options: [
        { value: 'g', label: 'Curious & reflective', scores: w('guide') },
        { value: 'c', label: 'Direct & driven', scores: w('challenger') },
        { value: 'n', label: 'Warm & patient', scores: w('nurturer') },
        { value: 'e', label: 'Structured & knowledgeable', scores: w('expert') },
      ],
    },
  ],
  score: (answers: Answers) => {
    const dim = scoreDimensions(coachPersonaCodex.steps, answers);
    const top = (DIMS as readonly string[]).reduce((a, b) => ((dim[b] ?? 0) > (dim[a] ?? 0) ? b : a), DIMS[0]) as CDim;
    const p = PERSONAS[top];
    return {
      kind: 'persona',
      title: p.title,
      tagline: p.tagline,
      blurb: p.blurb,
      traits: DIMS.map((d) => ({ label: PERSONAS[d].title, value: dim[d] ?? 0 })),
      strengths: p.strengths,
      watchouts: p.watchouts,
      recommendations: p.recommendations,
    };
  },
};
