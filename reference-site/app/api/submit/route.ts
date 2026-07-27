import { NextResponse } from 'next/server';
import { recordSubmission } from '@/lib/admin/submissions';

export const runtime = 'nodejs';

/**
 * POST /api/submit — the single ingestion endpoint for EVERY public form.
 * Body: { formKey, formLabel?, name?, email?, phone?, answers?, sourceUrl? }
 * The form auto-registers in the Admin panel on its first submission. No auth
 * (public), captures IP + user-agent server-side.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const formKey = typeof body.formKey === 'string' ? body.formKey.trim() : '';
  if (!formKey) return NextResponse.json({ error: 'formKey is required.' }, { status: 422 });

  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 300) : null);

  const sub = await recordSubmission({
    formKey,
    formLabel: typeof body.formLabel === 'string' ? body.formLabel : undefined,
    uid: str(body.uid),
    name: str(body.name),
    email: str(body.email),
    phone: str(body.phone),
    answers: typeof body.answers === 'object' && body.answers ? (body.answers as Record<string, unknown>) : {},
    sourceUrl: str(body.sourceUrl),
    request,
  });

  return NextResponse.json({ ok: true, id: sub.id }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
