import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { listPrograms, upsertProgram } from '@/lib/cms/store';
import { audit } from '@/lib/admin/audit';
import type { CmsProgram } from '@/lib/cms/types';

export const runtime = 'nodejs';

export async function GET() {
  const g = await requireApiAdmin({ permission: 'programs.manage' });
  if (g instanceof NextResponse) return g;
  return NextResponse.json({ programs: await listPrograms() }, { headers: { 'Cache-Control': 'no-store' } });
}

/** POST — create or update a program (send `id` to update). */
export async function POST(request: Request) {
  const g = await requireApiAdmin({ request, permission: 'programs.manage' });
  if (g instanceof NextResponse) return g;

  let body: Partial<CmsProgram>;
  try {
    body = (await request.json()) as Partial<CmsProgram>;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  if (!body.id && !body.name) return NextResponse.json({ error: 'Program name is required.' }, { status: 422 });
  if (typeof body.perks === 'string') body.perks = (body.perks as unknown as string).split('\n').map((s) => s.trim()).filter(Boolean);

  const saved = await upsertProgram(body);
  await audit(g.email, body.id ? 'program.update' : 'program.create', saved.id, { after: saved });
  return NextResponse.json({ ok: true, program: saved }, { status: body.id ? 200 : 201 });
}
