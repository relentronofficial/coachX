import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Pure password hashing (scrypt) — no server-only/fs imports, so it is unit-
 * testable. Hash format: "<saltHex>:<hashHex>".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const hash = Buffer.from(hashHex, 'hex');
  const check = scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
  return hash.length === check.length && timingSafeEqual(hash, check);
}
