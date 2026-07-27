'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { adminFetch } from './adminFetch';
import type { CmsProgram } from '@/lib/cms/types';
import { INR_SYMBOL } from '@/lib/currency';

const empty: Partial<CmsProgram> = { name: '', price: `${INR_SYMBOL}0`, cadence: '/mo', summary: '', perks: [], featured: false, published: true };

/** Create / edit / delete / publish programs — reflected on the public site. */
export function ProgramsManager() {
  const [items, setItems] = useState<CmsProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CmsProgram> | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/cms/programs', { cache: 'no-store' });
    const d = await res.json();
    setItems(res.ok ? d.programs : []);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function save(p: Partial<CmsProgram>) {
    const body = { ...p, perks: Array.isArray(p.perks) ? p.perks : String(p.perks ?? '').split('\n').filter(Boolean) };
    await adminFetch('/api/admin/cms/programs', { method: 'POST', body: JSON.stringify(body) });
    setEditing(null);
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Delete this program?')) return;
    await adminFetch(`/api/admin/cms/programs/${id}`, { method: 'DELETE' });
    await load();
  }
  async function togglePublish(p: CmsProgram) {
    await adminFetch('/api/admin/cms/programs', { method: 'POST', body: JSON.stringify({ id: p.id, published: !p.published }) });
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold text-ink">Programs</h1>
        <a href="/programs" target="_blank" className="text-sm font-semibold text-teal hover:underline">View public page ↗</a>
        <button onClick={() => setEditing({ ...empty })} className="btn-primary" data-testid="new-program">
          + New program
        </button>
      </div>

      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Price</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-400">No programs.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0" data-testid="program-row">
                  <td className="p-3 font-medium text-ink">{p.name}{p.featured ? ' ★' : ''}</td>
                  <td className="p-3 text-slate-600">{p.price} {p.cadence}</td>
                  <td className="p-3">
                    <button onClick={() => togglePublish(p)} className={`rounded-pill px-2 py-1 text-xs font-semibold ${p.published ? 'bg-teal/15 text-teal' : 'bg-slate-100 text-slate-500'}`}>
                      {p.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3 text-xs">
                      <button onClick={() => setEditing(p)} className="font-semibold text-teal hover:underline">Edit</button>
                      <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? <ProgramEditor value={editing} onCancel={() => setEditing(null)} onSave={save} /> : null}
    </div>
  );
}

function ProgramEditor({ value, onCancel, onSave }: { value: Partial<CmsProgram>; onCancel: () => void; onSave: (p: Partial<CmsProgram>) => void }) {
  const [p, setP] = useState<Partial<CmsProgram>>({ ...value, perks: value.perks ?? [] });
  const set = (patch: Partial<CmsProgram>) => setP({ ...p, ...patch });

  return (
    <Modal open onClose={onCancel} title={<span>{p.id ? 'Edit program' : 'New program'}</span>}>
      <div className="mt-3 space-y-3">
        <Input label="Name" value={p.name ?? ''} onChange={(v) => set({ name: v })} testid="program-name" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price" value={p.price ?? ''} onChange={(v) => set({ price: v })} />
          <Input label="Cadence" value={p.cadence ?? ''} onChange={(v) => set({ cadence: v })} />
        </div>
        <Input label="Summary" value={p.summary ?? ''} onChange={(v) => set({ summary: v })} />
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Perks (one per line)</span>
          <textarea
            value={Array.isArray(p.perks) ? p.perks.join('\n') : ''}
            onChange={(e) => set({ perks: e.target.value.split('\n') })}
            rows={4}
            className="mt-1 w-full rounded-card border border-slate-300 p-3 text-sm"
          />
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.featured} onChange={(e) => set({ featured: e.target.checked })} /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.published} onChange={(e) => set({ published: e.target.checked })} /> Published</label>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={() => onSave({ ...p, perks: (p.perks ?? []).map((s) => s.trim()).filter(Boolean) })} className="btn-primary" data-testid="program-save">Save</button>
      </div>
    </Modal>
  );
}

function Input({ label, value, onChange, testid }: { label: string; value: string; onChange: (v: string) => void; testid?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} className="mt-1 h-10 w-full rounded-card border border-slate-300 px-3 text-sm focus:border-teal focus:outline-none" />
    </label>
  );
}
