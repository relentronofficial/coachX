/**
 * Pure password-strength scorer (no dependencies) → a 0–4 score + label.
 * Heuristic: rewards length and character variety, penalises common/sequential
 * patterns. Not a substitute for a breach check, but a good UX signal.
 */
export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface Strength {
  score: StrengthLevel;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  suggestions: string[];
}

const COMMON = /(password|passwd|qwerty|admin|welcome|letmein|1234|abcd|iloveyou|coachx)/i;
const SEQUENTIAL = /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef)/i;

export function scorePassword(pw: string): Strength {
  const suggestions: string[] = [];
  if (!pw) return { score: 0, label: 'Very weak', suggestions: ['Enter a password'] };

  let points = 0;

  // Length.
  if (pw.length >= 8) points += 1;
  if (pw.length >= 12) points += 1;
  if (pw.length >= 16) points += 1;
  if (pw.length < 8) suggestions.push('Use at least 8 characters');

  // Variety.
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (variety >= 2) points += 1;
  if (variety >= 3) points += 1;
  if (!/[A-Z]/.test(pw)) suggestions.push('Add an uppercase letter');
  if (!/\d/.test(pw)) suggestions.push('Add a number');
  if (!/[^A-Za-z0-9]/.test(pw)) suggestions.push('Add a symbol');

  // Penalties.
  if (COMMON.test(pw)) {
    points -= 2;
    suggestions.push('Avoid common words');
  }
  if (SEQUENTIAL.test(pw)) {
    points -= 1;
    suggestions.push('Avoid sequences like 1234 or abcd');
  }
  if (/^(.)\1+$/.test(pw)) {
    points -= 2;
    suggestions.push('Avoid repeated characters');
  }

  const score = Math.max(0, Math.min(4, points)) as StrengthLevel;
  const label = (['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const)[score];
  return { score, label, suggestions: suggestions.slice(0, 3) };
}
