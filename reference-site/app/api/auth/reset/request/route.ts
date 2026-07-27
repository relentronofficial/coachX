import { NextResponse } from 'next/server';
import { findUser } from '@/lib/auth/users';
import { createResetToken } from '@/lib/auth/resetTokens';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/reset/request — start a password reset.
 * Always responds 200 with a generic message (no account enumeration). If the
 * account exists, a single-use token is created. In dev the reset link is
 * returned in `devResetUrl`; in production, email it instead and drop that field.
 */
export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 422 });

  const generic = { ok: true, message: 'If an account exists for that email, a reset link has been sent.' };

  const user = await findUser(email);
  if (!user) return NextResponse.json(generic);

  const token = await createResetToken(email);
  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/reset-password?token=${token}`;

  // NOTE: In production, send `resetUrl` by email and remove `devResetUrl`.
  return NextResponse.json({ ...generic, devResetUrl: resetUrl });
}
