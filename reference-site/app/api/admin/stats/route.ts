import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { stats, listForms } from '@/lib/admin/submissions';

export const runtime = 'nodejs';

/** GET /api/admin/stats — dashboard aggregates. */
export async function GET() {
  const g = await requireApiAdmin({ permission: 'dashboard.view' });
  if (g instanceof NextResponse) return g;
  const [s, forms] = await Promise.all([stats(), listForms()]);
  return NextResponse.json({ ...s, forms }, { headers: { 'Cache-Control': 'no-store' } });
}
