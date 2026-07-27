import type { ToolConfig, Answers } from '../types';

/**
 * Viral Reels Challenge — an ORIGINAL 5-day guided content challenge. Each step
 * is a day of tasks you check off; progress is saved so you can return. The
 * "result" is a completion summary + badge. (Original tasks and copy.)
 */

const DAY_TASKS: { id: string; label: string }[][] = [
  [
    { id: 'd1a', label: 'Pick one topic your ideal client cares about' },
    { id: 'd1b', label: 'Write 5 hook lines for it' },
    { id: 'd1c', label: 'Choose your strongest hook' },
  ],
  [
    { id: 'd2a', label: 'Script a 20–30 second reel around your hook' },
    { id: 'd2b', label: 'Keep one clear idea only' },
    { id: 'd2c', label: 'End with a simple call-to-action' },
  ],
  [
    { id: 'd3a', label: 'Record 3 takes' },
    { id: 'd3b', label: 'Pick the best take' },
    { id: 'd3c', label: 'Add captions' },
  ],
  [
    { id: 'd4a', label: 'Write a searchable caption' },
    { id: 'd4b', label: 'Add 3–5 relevant keywords/hashtags' },
    { id: 'd4c', label: 'Publish it' },
  ],
  [
    { id: 'd5a', label: 'Reply to every comment for 30 minutes' },
    { id: 'd5b', label: 'Note what worked and what didn’t' },
    { id: 'd5c', label: 'Plan your next reel' },
  ],
];

const totalTasks = DAY_TASKS.reduce((n, d) => n + d.length, 0);

export const viralReelsChallenge: ToolConfig = {
  slug: 'viral-reels-challenge',
  name: 'Viral Reels Challenge',
  category: 'Marketing',
  icon: '🎬',
  tagline: 'Publish your first standout reel in 5 days',
  description: 'A 5-day guided challenge — check off tasks each day. Your progress is saved.',
  origin: 'original-equivalent',
  estMinutes: 5,
  start: {
    headline: 'The 5-Day Viral Reels Challenge',
    sub: 'Go from idea to a published reel in five short, guided days. Check off each task as you go.',
    bullets: ['5 days, ~15 min each', 'Progress saved automatically', 'Finish with a shareable badge'],
  },
  steps: DAY_TASKS.map((tasks, i) => ({
    id: `day${i + 1}`,
    type: 'multi' as const,
    min: 1,
    title: `Day ${i + 1}: ${['Hook', 'Script', 'Record', 'Publish', 'Engage'][i]}`,
    help: 'Check off what you complete today (at least one to continue).',
    options: tasks.map((t) => ({ value: t.id, label: t.label })),
  })),
  score: (answers: Answers) => {
    let completed = 0;
    for (const step of viralReelsChallenge.steps) {
      const a = answers[step.id];
      if (Array.isArray(a)) completed += a.length;
    }
    const percent = Math.round((completed / totalTasks) * 100);
    const level = percent === 100 ? 'Challenge Complete' : percent >= 60 ? 'Almost There' : 'In Progress';
    const blurb =
      percent === 100
        ? 'You did it — a published reel and a repeatable process you can run every week.'
        : percent >= 60
          ? 'Strong progress. Finish the remaining tasks to complete the challenge.'
          : 'You’ve started — keep going one task at a time.';
    return {
      kind: 'challenge',
      completed,
      total: totalTasks,
      percent,
      level,
      blurb,
      nextSteps:
        percent === 100
          ? ['Repeat the 5 steps for your next reel', 'Turn your best reel into a content series']
          : ['Complete the unchecked tasks', 'Come back anytime — your progress is saved'],
    };
  },
};
