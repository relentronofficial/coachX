import { NextResponse } from 'next/server';
import { validateLead, saveLead, shortRef } from '@/lib/leads';

// Needs the Node.js runtime for filesystem persistence.
export const runtime = 'nodejs';

/**
 * POST /api/leads — capture a registration / newsletter opt-in.
 * NO payment is taken. Returns a reference id on success.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = validateLead(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  const lead = await saveLead(parsed.value);
  return NextResponse.json(
    { ok: true, id: lead.id, ref: shortRef(lead.id), type: lead.type },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}
