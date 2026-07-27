import type { ToolConfig } from '../types';
import { personalCodex } from './personalCodex';
import { coachPersonaCodex } from './coachPersonaCodex';
import { freedomBusinessCodex } from './freedomBusinessCodex';
import { skillsStrengthScorecard } from './skillsStrengthScorecard';
import { viralReelsChallenge } from './viralReelsChallenge';
import { youtubeDomination } from './youtubeDomination';

/** Tools driven by the shared AssessmentWizard engine (the Niche Finder keeps
 *  its own bespoke component). */
export const engineTools: ToolConfig[] = [
  personalCodex,
  coachPersonaCodex,
  freedomBusinessCodex,
  skillsStrengthScorecard,
  viralReelsChallenge,
  youtubeDomination,
];

export function engineToolBySlug(slug: string): ToolConfig | undefined {
  return engineTools.find((t) => t.slug === slug);
}

export {
  personalCodex,
  coachPersonaCodex,
  freedomBusinessCodex,
  skillsStrengthScorecard,
  viralReelsChallenge,
  youtubeDomination,
};
