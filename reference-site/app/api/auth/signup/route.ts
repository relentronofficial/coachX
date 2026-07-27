import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth/users';
import { signToken, sessionCookieOptions, SESSION_COOKIE, type SessionUser } from '@/lib/auth/jwt';
import { resolveEffectiveRole } from '@/lib/auth/rolesStore';
import { recordSubmission } from '@/lib/admin/submissions';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/signup — create an account (persisted, scrypt-hashed) and sign
 * the user in immediately by issuing a session cookie.
 */
export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 422 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 422 });

  const created = await createUser(email, name, password);
  if (!created.ok) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  // Record the registration as a submission so it appears in the Admin panel.
  await recordSubmission({
    formKey: 'registration',
    formLabel: 'User Registration',
    name: created.user.name,
    email: created.user.email,
    sourceUrl: '/signup',
    request,
  }).catch(() => undefined);

  const user: SessionUser = { email: created.user.email, name: created.user.name, role: await resolveEffectiveRole(created.user.email, created.user.role) };
  const token = await signToken(user);
  const res = NextResponse.json({ ok: true, user }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
