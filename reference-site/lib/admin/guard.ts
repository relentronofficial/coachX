import 'server-only';
import { NextResponse } from 'next/server';
import { getSession, type SessionUser } from '@/lib/auth/session';
import { isAdminRole, type Permission } from '@/lib/auth/permissions';
import { can } from '@/lib/auth/rolesStore';
import { verifyCsrf } from './csrf';

/**
 * Admin API guard. Returns the admin user, or a NextResponse (401/403) to
 * return directly. Optionally requires a specific permission, and enforces CSRF
 * on mutating requests.
 */
export async function requireApiAdmin(opts: { permission?: Permission; request?: Request } = {}): Promise<SessionUser | NextResponse> {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!isAdminRole(user.role)) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  // CSRF for state-changing methods.
  if (opts.request && !['GET', 'HEAD'].includes(opts.request.method)) {
    const ok = await verifyCsrf(opts.request);
    if (!ok) return NextResponse.json({ error: 'Invalid CSRF token.' }, { status: 403 });
  }

  if (opts.permission && !(await can(user.role, opts.permission))) {
    return NextResponse.json({ error: `Missing permission: ${opts.permission}` }, { status: 403 });
  }
  return user;
}
