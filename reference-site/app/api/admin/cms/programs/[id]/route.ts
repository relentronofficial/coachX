import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { deleteProgram } from '@/lib/cms/store';
import { audit } from '@/lib/admin/audit';

export const runtime = 'nodejs';

/** DELETE — remove a program. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireApiAdmin({ request, permission: 'programs.manage' });
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const ok = await deleteProgram(id);
  if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  await audit(g.email, 'program.delete', id, {});
  return NextResponse.json({ ok: true });
}
