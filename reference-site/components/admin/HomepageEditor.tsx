'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from './adminFetch';
import type { HomepageContent } from '@/lib/cms/types';

/** Edit the homepage hero + SEO without touching code. Saves to the CMS. */
export function HomepageEditor() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/cms/homepage', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setContent(d.content))
      .catch(() => setError('Could not load content.'));
  }, []);

  if (!content) return <p className="text-slate-400">{error ?? 'Loading…'}</p>;

  const hero = content.hero;
  const set = (patch: Partial<HomepageContent['hero']>) => setContent({ ...content, hero: { ...hero, ...patch } });
  const setSeo = (patch: Partial<HomepageContent['seo']>) => setContent({ ...content, seo: { ...content.seo, ...patch } });

  async function save() {
    setStatus('saving');
    setError(null);
    const res = await adminFetch('/api/admin/cms/homepage', { method: 'PUT', body: JSON.stringify(content) });
    if (res.ok) {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? 'Save failed.');
      setStatus('error');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section className="rounded-card border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Hero section</h2>
        <div className="mt-4 space-y-4">
          <Text label="Badge" value={hero.badge} onChange={(v) => set({ badge: v })} testid="hero-badge" />
          <Text label="Title" value={hero.title} onChange={(v) => set({ title: v })} testid="hero-title-input" />
          <Area label="Subtitle" value={hero.subtitle} onChange={(v) => set({ subtitle: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Primary CTA label" value={hero.primaryCta.label} onChange={(v) => set({ primaryCta: { ...hero.primaryCta, label: v } })} />
            <Text label="Primary CTA link" value={hero.primaryCta.href} onChange={(v) => set({ primaryCta: { ...hero.primaryCta, href: v } })} />
            <Text label="Secondary CTA label" value={hero.secondaryCta.label} onChange={(v) => set({ secondaryCta: { ...hero.secondaryCta, label: v } })} />
            <Text label="Secondary CTA link" value={hero.secondaryCta.href} onChange={(v) => set({ secondaryCta: { ...hero.secondaryCta, href: v } })} />
          </div>
          <Text label="Trust line" value={hero.trust} onChange={(v) => set({ trust: v })} />
        </div>
      </section>

      <section className="rounded-card border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">SEO</h2>
        <div className="mt-4 space-y-4">
          <Text label="Meta title" value={content.seo.title} onChange={(v) => setSeo({ title: v })} />
          <Area label="Meta description" value={content.seo.description} onChange={(v) => setSeo({ description: v })} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={status === 'saving'} className="btn-primary disabled:opacity-60" data-testid="homepage-save">
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
        {status === 'saved' ? <span className="text-sm font-semibold text-teal" data-testid="save-ok">Saved ✓</span> : null}
        {error ? <span className="text-sm text-red-500">{error}</span> : null}
        <a href="/" target="_blank" className="ml-auto text-sm font-semibold text-teal hover:underline">
          View homepage ↗
        </a>
      </div>
    </div>
  );
}

function Text({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} className="mt-1 h-10 w-full rounded-card border border-slate-300 px-3 text-sm focus:border-teal focus:outline-none" />
    </label>
  );
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1 w-full rounded-card border border-slate-300 p-3 text-sm focus:border-teal focus:outline-none" />
    </label>
  );
}
