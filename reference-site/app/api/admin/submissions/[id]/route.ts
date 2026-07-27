import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { updateSubmission, deleteSubmission, getSubmission, type SubmissionPatch, type SubmissionStatus } from '@/lib/admin/submissions';
import { audit } from '@/lib/admin/audit';

export const runtime = 'nodejs';

const STATUSES: SubmissionStatus[] = ['new', 'contacted', 'qualified', 'converted'];

/** PATCH /api/admin/submissions/:id — update status/notes/tags/assign/archive/contact fields. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireApiAdmin({ request, permission: 'submissions.manage' });
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const before = await getSubmission(id);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const patch: SubmissionPatch = {};
  if (typeof body.status === 'string' && STATUSES.includes(body.status as SubmissionStatus)) patch.status = body.status as SubmissionStatus;
  if (typeof body.archived === 'boolean') patch.archived = body.archived;
  if (typeof body.notes === 'string') patch.notes = body.notes.slice(0, 2000);
  if (typeof body.assignedTo === 'string' || body.assignedTo === null) patch.assignedTo = (body.assignedTo as string) ?? null;
  if (Array.isArray(body.tags)) patch.tags = (body.tags as unknown[]).filter((t) => typeof t === 'string').slice(0, 20) as string[];
  if (typeof body.name === 'string') patch.name = body.name.slice(0, 120);
  if (typeof body.email === 'string') patch.email = body.email.slice(0, 160);
  if (typeof body.phone === 'string') patch.phone = body.phone.slice(0, 40);

  const updated = await updateSubmission(id, patch);
  if (!updated) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  await audit(g.email, 'submission.update', id, { before: pick(before, patch), after: patch });
  return NextResponse.json({ ok: true, submission: updated });
}

/** Old values for the fields being changed (for the audit log). */
function pick(before: Awaited<ReturnType<typeof getSubmission>>, patch: SubmissionPatch): Record<string, unknown> {
  if (!before) return {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(patch)) out[k] = (before as unknown as Record<string, unknown>)[k];
  return out;
}

/** GET /api/admin/submissions/:id — full detail. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireApiAdmin({ permission: 'submissions.view' });
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const sub = await getSubmission(id);
  if (!sub) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ submission: sub });
}

/** DELETE /api/admin/submissions/:id */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireApiAdmin({ request, permission: 'submissions.manage' });
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const before = await getSubmission(id);
  const ok = await deleteSubmission(id);
  if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  await audit(g.email, 'submission.delete', id, { before: { email: before?.email, formKey: before?.formKey } });
  return NextResponse.json({ ok: true });
}
