import { SignJWT, jwtVerify } from 'jose';
import { asRole, type Role } from './permissions';

/**
 * Pure JWT session helpers (no next/headers, no server-only) so they can be
 * unit-tested and reused across route handlers and the server session reader.
 */

export const SESSION_COOKIE = 'cx_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? 'dev-only-insecure-secret-change-me-in-production',
);

export type { Role };

export interface SessionUser {
  email: string;
  name: string;
  role: Role;
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret);
}

/** Verify signature + expiry. Returns the user or null (invalid/expired). */
export async function verifyToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.email) return null;
    return { email: String(payload.email), name: String(payload.name ?? payload.email), role: asRole(payload.role) };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}
