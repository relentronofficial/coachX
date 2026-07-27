import { NextResponse } from 'next/server';
import { consumeResetToken } from '@/lib/auth/resetTokens';
import { updateUserPassword } from '@/lib/auth/users';
import { signToken, sessionCookieOptions, SESSION_COOKIE, type SessionUser } from '@/lib/auth/jwt';
import { findUser } from '@/lib/auth/users';
import { resolveEffectiveRole } from '@/lib/auth/rolesStore';

export const runtime = 'nodejs';

/**
 * POST /api/auth/reset/confirm — set a new password using a valid reset token.
 * The token is single-use; on success the user is signed in with a fresh session.
 */
export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!token) return NextResponse.json({ error: 'Missing reset token.' }, { status: 422 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 422 });

  const email = await consumeResetToken(token);
  if (!email) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });

  const updated = await updateUserPassword(email, password);
  if (!updated) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });

  const account = await findUser(email);
  const user: SessionUser = { email, name: account?.name ?? email.split('@')[0], role: await resolveEffectiveRole(email, account?.role) };
  const jwt = await signToken(user);

  const res = NextResponse.json({ ok: true, user }, { status: 200 });
  res.cookies.set(SESSION_COOKIE, jwt, sessionCookieOptions());
  return res;
}
