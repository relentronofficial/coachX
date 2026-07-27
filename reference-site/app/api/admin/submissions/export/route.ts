import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { listSubmissions, toCsv, type SubmissionStatus } from '@/lib/admin/submissions';
import { audit } from '@/lib/admin/audit';

export const runtime = 'nodejs';

const STATUSES: SubmissionStatus[] = ['new', 'contacted', 'qualified', 'converted'];

/** GET /api/admin/submissions/export?formKey&q&status → CSV download (opens in Excel). */
export async function GET(request: Request) {
  const g = await requireApiAdmin({ permission: 'submissions.export' });
  if (g instanceof NextResponse) return g;

  const p = new URL(request.url).searchParams;
  const statusParam = p.get('status');
  const { rows } = await listSubmissions({
    formKey: p.get('formKey') ?? undefined,
    q: p.get('q') ?? undefined,
    status: STATUSES.includes(statusParam as SubmissionStatus) ? (statusParam as SubmissionStatus) : undefined,
    archived: p.get('archived') === 'true' ? true : p.get('archived') === 'false' ? false : undefined,
    page: 1,
    pageSize: 100000,
  });

  await audit(g.email, 'submission.export', p.get('formKey'), { count: rows.length });

  const csv = toCsv(rows);
  const name = `submissions-${p.get('formKey') ?? 'all'}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  });
}
