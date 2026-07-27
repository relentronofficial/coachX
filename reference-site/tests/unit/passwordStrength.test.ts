import { describe, it, expect } from 'vitest';
import { scorePassword } from '@/lib/passwordStrength';

describe('scorePassword', () => {
  it('rates an empty password as very weak', () => {
    expect(scorePassword('').score).toBe(0);
  });

  it('rates a short simple password as weak', () => {
    expect(scorePassword('abc').score).toBeLessThanOrEqual(1);
  });

  it('rewards length + variety', () => {
    const s = scorePassword('Str0ng&Passphrase99');
    expect(s.score).toBeGreaterThanOrEqual(3);
    expect(['Good', 'Strong']).toContain(s.label);
  });

  it('penalises common words', () => {
    expect(scorePassword('Password123').score).toBeLessThan(scorePassword('Zx9$mQ2!vLp7').score);
  });

  it('penalises repeated characters', () => {
    expect(scorePassword('aaaaaaaa').score).toBe(0);
  });

  it('suggests improvements for a weak password', () => {
    const s = scorePassword('alllowercase');
    expect(s.suggestions.length).toBeGreaterThan(0);
  });
});
