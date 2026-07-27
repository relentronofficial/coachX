import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { bulkUpdate, bulkDelete, type SubmissionPatch, type SubmissionStatus } from '@/lib/admin/submissions';
import { audit } from '@/lib/admin/audit';

export const runtime = 'nodejs';

const STATUSES: SubmissionStatus[] = ['new', 'contacted', 'qualified', 'converted'];

/**
 * POST /api/admin/submissions/bulk
 * Body: { ids: string[], action: 'status'|'archive'|'unarchive'|'delete', status? }
 */
export async function POST(request: Request) {
  const g = await requireApiAdmin({ request, permission: 'submissions.manage' });
  if (g instanceof NextResponse) return g;

  let body: { ids?: unknown; action?: unknown; status?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? (body.ids.filter((x) => typeof x === 'string') as string[]) : [];
  if (!ids.length) return NextResponse.json({ error: 'No ids provided.' }, { status: 422 });
  const action = String(body.action);

  let affected = 0;
  if (action === 'delete') {
    affected = await bulkDelete(ids);
  } else if (action === 'archive' || action === 'unarchive') {
    affected = await bulkUpdate(ids, { archived: action === 'archive' });
  } else if (action === 'status' && STATUSES.includes(body.status as SubmissionStatus)) {
    const patch: SubmissionPatch = { status: body.status as SubmissionStatus };
    affected = await bulkUpdate(ids, patch);
  } else {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 422 });
  }

  await audit(g.email, `submission.bulk.${action}`, null, { count: affected, status: body.status });
  return NextResponse.json({ ok: true, affected });
}
