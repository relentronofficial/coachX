import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { listSubmissions, type SubmissionStatus } from '@/lib/admin/submissions';

export const runtime = 'nodejs';

const STATUSES: SubmissionStatus[] = ['new', 'contacted', 'qualified', 'converted'];

/** GET /api/admin/submissions?formKey&q&status&archived&page&pageSize */
export async function GET(request: Request) {
  const g = await requireApiAdmin({ permission: 'submissions.view' });
  if (g instanceof NextResponse) return g;

  const url = new URL(request.url);
  const p = url.searchParams;
  const statusParam = p.get('status');
  const archivedParam = p.get('archived');

  const result = await listSubmissions({
    formKey: p.get('formKey') ?? undefined,
    q: p.get('q') ?? undefined,
    status: STATUSES.includes(statusParam as SubmissionStatus) ? (statusParam as SubmissionStatus) : undefined,
    archived: archivedParam === null ? undefined : archivedParam === 'true',
    page: Number(p.get('page')) || 1,
    pageSize: Number(p.get('pageSize')) || 20,
  });

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
