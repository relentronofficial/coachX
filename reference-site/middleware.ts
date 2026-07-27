import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/auth/jwt';
import { isAdminRole } from '@/lib/auth/permissions';

/**
 * Edge middleware — blocks /admin and /api/admin before any page/route runs.
 * Guests → redirected to /login; authenticated non-admins → 403 (API) or the
 * login page (pages). Route handlers and the admin layout re-check as well.
 */
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/dashboard/:path*', '/profile/:path*'],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifyToken(token);
  const isApi = req.nextUrl.pathname.startsWith('/api/admin');

  // APIs: block guests (401) and non-admins (403) outright.
  if (isApi) {
    if (user && isAdminRole(user.role)) return NextResponse.next();
    return NextResponse.json({ error: user ? 'Forbidden' : 'Unauthorized' }, { status: user ? 403 : 401 });
  }

  // Pages: redirect guests to login; let authenticated non-admins reach the
  // layout, which renders a proper 403 "Access denied" page.
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
