import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { sendResultEmail } from '@/lib/nicheAI/email.server';

export const runtime = 'nodejs';

/**
 * POST /api/niche-finder/email — email the signed-in user their result.
 * Login is required; the recipient is always the session user's email (a user
 * can only email themselves), so this cannot be used to send to arbitrary
 * addresses.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  let body: { topNiche?: string; score?: number; summary?: string; name?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const out = await sendResultEmail({
    email: session.email,
    name: session.name ?? body.name,
    topNiche: typeof body.topNiche === 'string' ? body.topNiche : undefined,
    score: typeof body.score === 'number' ? body.score : undefined,
    summary: typeof body.summary === 'string' ? body.summary.slice(0, 400) : undefined,
  });

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
