import type { ToolConfig, Answers } from '../types';
import { scoreDimensions } from '../engine';

/**
 * My Personal Codex — an ORIGINAL clarity/identity assessment that maps you to
 * one of four working personas. (Reference-site equivalent was member-gated;
 * questions/scoring/report here are entirely our own.)
 */

const DIMS = ['builder', 'mentor', 'connector', 'strategist'] as const;
type PDim = (typeof DIMS)[number];

const PERSONAS: Record<PDim, { title: string; tagline: string; blurb: string; strengths: string[]; watchouts: string[]; recommendations: string[] }> = {
  builder: {
    title: 'The Builder',
    tagline: 'You turn ideas into things that work',
    blurb: 'You are happiest creating — products, systems, offers. You learn by making and shipping.',
    strengths: ['Turns concepts into real deliverables', 'Comfortable with tools and systems', 'Bias toward action'],
    watchouts: ['Can over-build before validating', 'May skip the marketing story'],
    recommendations: ['Package one skill into a simple offer this month', 'Use the Freedom Business Codex to pressure-test it'],
  },
  mentor: {
    title: 'The Mentor',
    tagline: 'You are energized by other people’s breakthroughs',
    blurb: 'Teaching and transformation light you up. You explain things in ways that stick.',
    strengths: ['Natural teacher', 'Builds trust quickly', 'Great at 1:1 and group coaching'],
    watchouts: ['Can undercharge', 'May avoid systems and self-promotion'],
    recommendations: ['Structure your teaching into a repeatable program', 'Run the Coach Persona Codex next'],
  },
  connector: {
    title: 'The Connector',
    tagline: 'You grow through people and community',
    blurb: 'Relationships are your superpower. Community, partnerships and word-of-mouth come naturally.',
    strengths: ['Builds engaged communities', 'Strong referrals and partnerships', 'Reads people well'],
    watchouts: ['Can spread attention thin', 'May under-invest in offer depth'],
    recommendations: ['Turn your network into a small paid community', 'Define one clear offer to point people to'],
  },
  strategist: {
    title: 'The Strategist',
    tagline: 'You see the smartest path before others do',
    blurb: 'Positioning, planning and leverage are your instincts. You play the long game.',
    strengths: ['Sharp positioning', 'Plans for leverage', 'Sees the bigger picture'],
    watchouts: ['Can over-plan and under-ship', 'May delay launching'],
    recommendations: ['Commit to one 30-day execution sprint', 'Use the Skills Strength Scorecard to find the gap to fix first'],
  },
};

const w = (d: PDim, n = 2): Record<string, number> => ({ [d]: n });

export const personalCodex: ToolConfig = {
  slug: 'personal-codex',
  name: 'My Personal Codex',
  category: 'Clarity',
  icon: '📜',
  tagline: 'Discover your natural working persona',
  description: 'Answer a few questions to reveal how you naturally create, teach, connect or strategise.',
  origin: 'original-equivalent',
  estMinutes: 3,
  start: {
    headline: 'Reveal your Personal Codex',
    sub: 'A short profile of how you naturally work best — so you can build a business that fits you.',
    bullets: ['Takes ~3 minutes', 'No login needed', 'Get a persona + next steps'],
  },
  dimensions: DIMS.map((id) => ({ id, label: PERSONAS[id].title })),
  steps: [
    {
      id: 'energy',
      type: 'single',
      title: 'What gives you the most energy?',
      options: [
        { value: 'b', label: 'Creating something new', icon: '🛠️', scores: w('builder') },
        { value: 'm', label: 'Helping someone have a breakthrough', icon: '💡', scores: w('mentor') },
        { value: 'c', label: 'Bringing people together', icon: '🤝', scores: w('connector') },
        { value: 's', label: 'Figuring out the smartest plan', icon: '♟️', scores: w('strategist') },
      ],
    },
    {
      id: 'instinct',
      type: 'single',
      title: 'You learn something useful. Your first instinct is to…',
      options: [
        { value: 'b', label: 'Build a system or tool around it', icon: '⚙️', scores: w('builder') },
        { value: 'm', label: 'Teach it to someone', icon: '🎓', scores: w('mentor') },
        { value: 'c', label: 'Share it with your community', icon: '📣', scores: w('connector') },
        { value: 's', label: 'Map how it fits the bigger picture', icon: '🗺️', scores: w('strategist') },
      ],
    },
    {
      id: 'compliment',
      type: 'single',
      title: 'Which compliment means the most?',
      options: [
        { value: 'b', label: '“You make things that work”', scores: w('builder') },
        { value: 'm', label: '“You changed how I think”', scores: w('mentor') },
        { value: 'c', label: '“You bring people together”', scores: w('connector') },
        { value: 's', label: '“You see what others miss”', scores: w('strategist') },
      ],
    },
    {
      id: 'afternoon',
      type: 'single',
      title: 'A free afternoon — you’d rather…',
      options: [
        { value: 'b', label: 'Prototype an idea', icon: '🧪', scores: w('builder') },
        { value: 'm', label: 'Coach or mentor someone', icon: '🧑‍🏫', scores: w('mentor') },
        { value: 'c', label: 'Host or join a meetup', icon: '🎉', scores: w('connector') },
        { value: 's', label: 'Plan your next move', icon: '📐', scores: w('strategist') },
      ],
    },
    {
      id: 'strengths',
      type: 'multi',
      min: 1,
      title: 'Which feel most like your strengths?',
      help: 'Pick all that apply.',
      options: [
        { value: 'b', label: 'Systems & processes', scores: w('builder') },
        { value: 'm', label: 'Teaching & explaining', scores: w('mentor') },
        { value: 'c', label: 'Relationships & rapport', scores: w('connector') },
        { value: 's', label: 'Positioning & strategy', scores: w('strategist') },
      ],
    },
  ],
  score: (answers: Answers) => {
    const dim = scoreDimensions(personalCodex.steps, answers);
    const top = (DIMS as readonly string[]).reduce((a, b) => ((dim[b] ?? 0) > (dim[a] ?? 0) ? b : a), DIMS[0]) as PDim;
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
