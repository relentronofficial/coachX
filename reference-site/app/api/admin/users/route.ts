import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { listUsers } from '@/lib/auth/users';
import { isAdminEmail } from '@/lib/auth/roles';

export const runtime = 'nodejs';

/** GET /api/admin/users — registered accounts (no password hashes). */
export async function GET() {
  const g = await requireApiAdmin({ permission: 'users.manage' });
  if (g instanceof NextResponse) return g;
  const users = (await listUsers()).map((u) => ({
    email: u.email,
    name: u.name,
    role: isAdminEmail(u.email) ? 'admin' : (u.role ?? 'user'),
    createdAt: u.createdAt,
  }));
  return NextResponse.json({ users }, { headers: { 'Cache-Control': 'no-store' } });
}
