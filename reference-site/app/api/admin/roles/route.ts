import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { getAllRolePermissions, setRolePermissions } from '@/lib/auth/rolesStore';
import { PERMISSIONS, ROLES, asRole, type Permission } from '@/lib/auth/permissions';
import { audit } from '@/lib/admin/audit';

export const runtime = 'nodejs';

const PERM_KEYS = new Set(PERMISSIONS.map((p) => p.key));

export async function GET() {
  const g = await requireApiAdmin({ permission: 'roles.manage' });
  if (g instanceof NextResponse) return g;
  return NextResponse.json({ matrix: await getAllRolePermissions() }, { headers: { 'Cache-Control': 'no-store' } });
}

/** PUT — set a role's permissions. Body: { role, permissions: string[] } */
export async function PUT(request: Request) {
  const g = await requireApiAdmin({ request, permission: 'roles.manage' });
  if (g instanceof NextResponse) return g;

  let body: { role?: unknown; permissions?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const role = asRole(body.role);
  if (!ROLES.includes(role) || role === 'user') return NextResponse.json({ error: 'Invalid role.' }, { status: 422 });
  if (role === 'super-admin') return NextResponse.json({ error: 'Super Admin permissions are fixed.' }, { status: 422 });
  const perms = Array.isArray(body.permissions)
    ? (body.permissions.filter((p) => typeof p === 'string' && PERM_KEYS.has(p as Permission)) as Permission[])
    : [];

  await setRolePermissions(role, perms);
  await audit(g.email, 'roles.update', role, { after: perms });
  return NextResponse.json({ ok: true });
}
