import { NextResponse } from 'next/server';
import { signToken, sessionCookieOptions, SESSION_COOKIE, type SessionUser } from '@/lib/auth/jwt';
import { findUser, verifyPassword } from '@/lib/auth/users';
import { resolveEffectiveRole } from '@/lib/auth/rolesStore';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/login
 * Requires a registered account. The submitted password is checked against the
 * account's scrypt hash; unknown emails and wrong passwords are both rejected
 * with the same generic message (no account enumeration).
 */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 422 });
  if (!password) return NextResponse.json({ error: 'Enter your password.' }, { status: 422 });

  const existing = await findUser(email);
  if (!existing || !verifyPassword(password, existing.passwordHash)) {
    return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
  }

  const user: SessionUser = { email: existing.email, name: existing.name, role: await resolveEffectiveRole(existing.email, existing.role) };
  const token = await signToken(user);

  const res = NextResponse.json({ ok: true, user }, { status: 200 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
