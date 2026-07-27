'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from './adminFetch';
import type { SiteSettings } from '@/lib/cms/types';

type Section = 'site' | 'seo' | 'theme' | 'all';

/** Edit site / SEO / theme settings from the CMS. */
export function SettingsEditor({ section = 'all' }: { section?: Section }) {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/cms/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setS(d.settings));
  }, []);

  if (!s) return <p className="text-slate-400">Loading…</p>;

  const show = (sec: Section) => section === 'all' || section === sec;

  async function save() {
    setSaving(true);
    await adminFetch('/api/admin/cms/settings', { method: 'PUT', body: JSON.stringify(s) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {show('site') ? (
        <Card title="Site">
          <T label="Name" value={s.site.name} onChange={(v) => setS({ ...s, site: { ...s.site, name: v } })} />
          <T label="Short name" value={s.site.short} onChange={(v) => setS({ ...s, site: { ...s.site, short: v } })} />
          <T label="Tagline" value={s.site.tagline} onChange={(v) => setS({ ...s, site: { ...s.site, tagline: v } })} />
          <T label="Contact email" value={s.site.email} onChange={(v) => setS({ ...s, site: { ...s.site, email: v } })} />
        </Card>
      ) : null}

      {show('seo') ? (
        <Card title="SEO">
          <T label="Default meta title" value={s.seo.defaultTitle} onChange={(v) => setS({ ...s, seo: { ...s.seo, defaultTitle: v } })} testid="seo-title" />
          <T label="Default meta description" value={s.seo.defaultDescription} onChange={(v) => setS({ ...s, seo: { ...s.seo, defaultDescription: v } })} />
          <T label="OG image path" value={s.seo.ogImage} onChange={(v) => setS({ ...s, seo: { ...s.seo, ogImage: v } })} />
          <T label="Robots" value={s.seo.robots} onChange={(v) => setS({ ...s, seo: { ...s.seo, robots: v } })} />
        </Card>
      ) : null}

      {show('theme') ? (
        <Card title="Theme">
          <Color label="Primary" value={s.theme.primary} onChange={(v) => setS({ ...s, theme: { ...s.theme, primary: v } })} testid="theme-primary" />
          <Color label="Accent" value={s.theme.accent} onChange={(v) => setS({ ...s, theme: { ...s.theme, accent: v } })} />
          <Color label="Ink (dark)" value={s.theme.ink} onChange={(v) => setS({ ...s, theme: { ...s.theme, ink: v } })} />
          <p className="text-xs text-slate-400">Theme tokens are stored in the CMS; apply them to Tailwind CSS variables to fully re-skin the site.</p>
        </Card>
      ) : null}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60" data-testid="settings-save">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved ? <span className="text-sm font-semibold text-teal" data-testid="settings-saved">Saved ✓</span> : null}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
function T({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} className="mt-1 h-10 w-full rounded-card border border-slate-300 px-3 text-sm focus:border-teal focus:outline-none" />
    </label>
  );
}
function Color({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid?: string }) {
  return (
    <label className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border border-slate-300" />
      <span className="text-sm text-slate-700">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} className="ml-auto h-9 w-28 rounded-card border border-slate-300 px-2 text-sm" />
    </label>
  );
}
