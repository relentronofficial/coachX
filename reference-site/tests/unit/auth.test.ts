import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '@/lib/auth/jwt';

describe('jwt session', () => {
  it('round-trips a valid session', async () => {
    const token = await signToken({ email: 'coach@example.com', name: 'coach', role: 'user' });
    const user = await verifyToken(token);
    expect(user).toEqual({ email: 'coach@example.com', name: 'coach', role: 'user' });
  });

  it('preserves the admin role', async () => {
    const token = await signToken({ email: 'admin@coachx.com', name: 'admin', role: 'admin' });
    expect(await verifyToken(token)).toMatchObject({ role: 'admin' });
  });

  it('rejects a missing token', async () => {
    expect(await verifyToken(undefined)).toBeNull();
    expect(await verifyToken('')).toBeNull();
  });

  it('rejects a tampered/garbage token', async () => {
    const token = await signToken({ email: 'a@b.com', name: 'a' });
    const tampered = token.slice(0, -3) + 'xyz';
    expect(await verifyToken(tampered)).toBeNull();
    expect(await verifyToken('not-a-jwt')).toBeNull();
  });
});
