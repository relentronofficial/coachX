import 'server-only';
import { randomBytes } from 'node:crypto';
import type { NextResponse } from 'next/server';
import { SESSION_MAX_AGE } from '@/lib/auth/jwt';

/**
 * CSRF protection via the double-submit-cookie pattern. A non-httpOnly cookie
 * (cx_csrf) is issued to the client; admin mutating requests must echo it in the
 * `x-csrf-token` header. Because attacker sites cannot read the cookie value,
 * they cannot forge a matching header.
 */
export const CSRF_COOKIE = 'cx_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export function generateCsrf(): string {
  return randomBytes(24).toString('hex');
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** Set/refresh the CSRF cookie on a response; returns the token used. */
export function ensureCsrfCookie(res: NextResponse, existing?: string | null): string {
  const token = existing || generateCsrf();
  res.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // must be readable by the client to echo it back
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return token;
}

/** Validate the header token against the cookie token. */
export async function verifyCsrf(request: Request): Promise<boolean> {
  const header = request.headers.get(CSRF_HEADER);
  const cookie = readCookie(request, CSRF_COOKIE);
  return !!header && !!cookie && header === cookie;
}

export function getCsrfFromRequest(request: Request): string | null {
  return readCookie(request, CSRF_COOKIE);
}
