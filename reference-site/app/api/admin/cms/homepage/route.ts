import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { getHomepage, setHomepage } from '@/lib/cms/store';
import { audit } from '@/lib/admin/audit';
import type { HomepageContent } from '@/lib/cms/types';

export const runtime = 'nodejs';

export async function GET() {
  const g = await requireApiAdmin({ permission: 'content.edit' });
  if (g instanceof NextResponse) return g;
  return NextResponse.json({ content: await getHomepage() }, { headers: { 'Cache-Control': 'no-store' } });
}

/** PUT — replace homepage content (hero + SEO). */
export async function PUT(request: Request) {
  const g = await requireApiAdmin({ request, permission: 'content.edit' });
  if (g instanceof NextResponse) return g;

  let body: HomepageContent;
  try {
    body = (await request.json()) as HomepageContent;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  if (!body?.hero || !body?.seo) return NextResponse.json({ error: 'Missing hero/seo.' }, { status: 422 });

  const before = await getHomepage();
  const saved = await setHomepage(body);
  await audit(g.email, 'homepage.update', 'homepage', { before: before.hero, after: saved.hero });
  return NextResponse.json({ ok: true, content: saved });
}
