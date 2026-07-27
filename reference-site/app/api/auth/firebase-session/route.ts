import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken, readUserRole } from '@/lib/auth/firebaseIdToken';
import { signToken, sessionCookieOptions, SESSION_COOKIE, type SessionUser } from '@/lib/auth/jwt';
import { ensureCsrfCookie, getCsrfFromRequest } from '@/lib/admin/csrf';

export const runtime = 'nodejs';

/**
 * POST /api/auth/firebase-session
 * Body: { idToken }
 * Verifies the Firebase ID token server-side, reads the user's role/status from
 * Firestore, and issues our httpOnly session cookie so middleware + server
 * guards enforce access. This is the JWT "bridge" that keeps route protection
 * working while Firebase is the primary authenticator.
 */
export async function POST(request: Request) {
  let body: { idToken?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  const idToken = typeof body.idToken === 'string' ? body.idToken : '';

  const identity = await verifyFirebaseIdToken(idToken);
  if (!identity) return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 });

  const { role, status } = await readUserRole(identity.uid, idToken);
  if (status === 'disabled') {
    return NextResponse.json({ error: 'This account is disabled.' }, { status: 403 });
  }

  const user: SessionUser = { email: identity.email, name: identity.name, role };
  const token = await signToken(user);

  const res = NextResponse.json({ ok: true, user: { ...user, uid: identity.uid } }, { status: 200 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  ensureCsrfCookie(res, getCsrfFromRequest(request));
  return res;
}

/** DELETE — clear the server session cookie (called on logout). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
