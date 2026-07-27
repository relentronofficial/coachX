/** Tool slugs that require authentication (client + server share this list). */
export const PROTECTED_TOOL_SLUGS = [
  'niche-finder',
  'personal-codex',
  'coach-persona-codex',
  'freedom-business-codex',
  'skills-strength-scorecard',
  'viral-reels-challenge',
  'youtube-domination',
] as const;

export function isProtectedToolSlug(slug: string): boolean {
  return (PROTECTED_TOOL_SLUGS as readonly string[]).includes(slug);
}
