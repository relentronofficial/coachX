import { NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/admin/guard';
import { getSettings, setSettings } from '@/lib/cms/store';
import { audit } from '@/lib/admin/audit';
import type { SiteSettings } from '@/lib/cms/types';

export const runtime = 'nodejs';

export async function GET() {
  const g = await requireApiAdmin({ permission: 'settings.manage' });
  if (g instanceof NextResponse) return g;
  return NextResponse.json({ settings: await getSettings() }, { headers: { 'Cache-Control': 'no-store' } });
}

/** PUT — replace site/SEO/theme settings. */
export async function PUT(request: Request) {
  const g = await requireApiAdmin({ request, permission: 'settings.manage' });
  if (g instanceof NextResponse) return g;

  let body: SiteSettings;
  try {
    body = (await request.json()) as SiteSettings;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  if (!body?.site || !body?.seo || !body?.theme) return NextResponse.json({ error: 'Missing sections.' }, { status: 422 });

  const before = await getSettings();
  const saved = await setSettings(body);
  await audit(g.email, 'settings.update', 'settings', { before, after: saved });
  return NextResponse.json({ ok: true, settings: saved });
}
