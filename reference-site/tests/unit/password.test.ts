import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('password hashing', () => {
  it('verifies a correct password', () => {
    const hash = hashPassword('correct horse battery');
    expect(verifyPassword('correct horse battery', hash)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const hash = hashPassword('correct horse battery');
    expect(verifyPassword('wrong password', hash)).toBe(false);
  });

  it('uses a random salt (same input → different hashes)', () => {
    expect(hashPassword('samepass1')).not.toBe(hashPassword('samepass1'));
  });

  it('rejects malformed stored values', () => {
    expect(verifyPassword('x', 'not-a-valid-hash')).toBe(false);
  });
});
