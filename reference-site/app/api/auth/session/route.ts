import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ensureCsrfCookie, getCsrfFromRequest, CSRF_COOKIE } from '@/lib/admin/csrf';

export const runtime = 'nodejs';

/**
 * GET /api/auth/session — returns the current server-validated user (or null)
 * and ensures a CSRF cookie exists for admin mutations.
 */
export async function GET(request: Request) {
  const user = await getSession();
  const res = NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
  ensureCsrfCookie(res, getCsrfFromRequest(request));
  void CSRF_COOKIE;
  return res;
}
