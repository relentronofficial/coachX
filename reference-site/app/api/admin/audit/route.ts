import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { listAudit } from '@/lib/admin/audit';

export const runtime = 'nodejs';

/** GET /api/admin/audit?page — admin action log. */
export async function GET(request: Request) {
  const g = await requireApiAdmin({ permission: 'audit.view' });
  if (g instanceof NextResponse) return g;
  const page = Number(new URL(request.url).searchParams.get('page')) || 1;
  const result = await listAudit(page, 50);
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
