import { NextResponse } from 'next/server';
import { scoreNiches, validateAnswers } from '@/lib/nicheScore';

/**
 * POST /api/niche-finder
 * Body: { categories: string[], audience, delivery: string[], goal, background }
 * Returns ranked niche matches with per-match reasons.
 *
 * Server-side scoring (the "backend logic") so results can't be trivially
 * reverse-engineered from the bundle and so the same engine can be reused by
 * other clients. No personal data is stored — the request is scored and dropped.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = validateAnswers(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 422 });
  }

  const result = scoreNiches(parsed.value);
  return NextResponse.json(result, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function GET() {
  return NextResponse.json({ error: 'Use POST to score answers.' }, { status: 405 });
}
