'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { adminFetch } from './adminFetch';

type Status = 'new' | 'contacted' | 'qualified' | 'converted';

interface Submission {
  id: string;
  formKey: string;
  formLabel: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, unknown>;
  status: Status;
  archived: boolean;
  sourceUrl: string | null;
  ip: string | null;
  device: string;
  browser: string;
  os: string;
  notes: string;
  assignedTo: string | null;
  tags: string[];
  createdAt: string;
}

interface ListResult {
  rows: Submission[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

const STATUSES: Status[] = ['new', 'contacted', 'qualified', 'converted'];
const STATUS_STYLE: Record<Status, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber/20 text-amber-dark',
  qualified: 'bg-violet/15 text-violet',
  converted: 'bg-teal/15 text-teal',
};

/**
 * Full-featured admin table over the unified submission store. Works for any
 * form via the `formKey` prop (omit to show all forms). All mutations are
 * admin-guarded server-side.
 */
export function SubmissionsTable({ formKey, title }: { formKey?: string; title?: string }) {
  const [data, setData] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | Status>('');
  const [archived, setArchived] = useState<'active' | 'archived'>('active');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Submission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (formKey) params.set('formKey', formKey);
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    params.set('archived', archived === 'archived' ? 'true' : 'false');
    params.set('page', String(page));
    params.set('pageSize', '10');
    const res = await fetch(`/api/admin/submissions?${params}`, { cache: 'no-store' });
    setData(res.ok ? await res.json() : { rows: [], total: 0, page: 1, pageSize: 10, pages: 1 });
    setSelected(new Set());
    setLoading(false);
  }, [formKey, q, status, archived, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(id: string, body: Record<string, unknown>) {
    await adminFetch(`/api/admin/submissions/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    await load();
  }
  async function remove(id: string) {
    if (!confirm('Delete this submission permanently?')) return;
    await adminFetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
    setDetail(null);
    await load();
  }
  async function bulk(action: string, extra: Record<string, unknown> = {}) {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === 'delete' && !confirm(`Delete ${ids.length} submission(s)?`)) return;
    await adminFetch('/api/admin/submissions/bulk', { method: 'POST', body: JSON.stringify({ ids, action, ...extra }) });
    await load();
  }

  const exportHref = `/api/admin/submissions/export?${new URLSearchParams({
    ...(formKey ? { formKey } : {}),
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    archived: archived === 'archived' ? 'true' : 'false',
  })}`;

  const rows = data?.rows ?? [];
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {title ? <h1 className="mr-auto text-xl font-extrabold text-ink">{title}</h1> : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void load();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            className="h-9 w-56 rounded-pill border border-slate-300 px-4 text-sm focus:border-teal focus:outline-none"
            data-testid="admin-search"
          />
          <button className="btn-secondary h-9 px-4 py-0 text-sm">Search</button>
        </form>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | Status);
            setPage(1);
          }}
          className="h-9 rounded-pill border border-slate-300 px-3 text-sm"
          data-testid="admin-status-filter"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={archived}
          onChange={(e) => {
            setArchived(e.target.value as 'active' | 'archived');
            setPage(1);
          }}
          className="h-9 rounded-pill border border-slate-300 px-3 text-sm"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <a href={exportHref} className="btn-secondary h-9 px-4 py-0 text-sm" data-testid="admin-export">
          Export CSV
        </a>
        <button onClick={() => window.print()} className="btn-secondary h-9 px-4 py-0 text-sm">
          Print
        </button>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-card bg-ink px-4 py-2 text-sm text-white" data-testid="bulk-bar">
          <span className="font-semibold">{selected.size} selected</span>
          <select
            onChange={(e) => e.target.value && bulk('status', { status: e.target.value })}
            defaultValue=""
            className="h-8 rounded-pill px-2 text-xs text-ink"
          >
            <option value="">Set status…</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button onClick={() => bulk(archived === 'archived' ? 'unarchive' : 'archive')} className="rounded-pill bg-white/15 px-3 py-1 text-xs">
            {archived === 'archived' ? 'Unarchive' : 'Archive'}
          </button>
          <button
            onClick={() => bulk('delete')}
            className="btn-fx-danger relative overflow-hidden rounded-pill bg-white/15 px-3 py-1 text-xs"
          >
            <span className="btn-label">Delete</span>
          </button>
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                  aria-label="Select all"
                />
              </th>
              <th className="p-3">Contact</th>
              {!formKey ? <th className="p-3">Form</th> : null}
              <th className="p-3">Status</th>
              <th className="p-3">Device</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400" data-testid="empty-state">
                  No submissions found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50" data-testid="submission-row">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(r.id);
                        else next.delete(r.id);
                        setSelected(next);
                      }}
                      aria-label={`Select ${r.email ?? r.id}`}
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-ink">{r.name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{r.email ?? '—'}</div>
                    {r.phone ? <div className="text-xs text-slate-400">{r.phone}</div> : null}
                  </td>
                  {!formKey ? <td className="p-3 text-slate-600">{r.formLabel}</td> : null}
                  <td className="p-3">
                    <select
                      value={r.status}
                      onChange={(e) => patch(r.id, { status: e.target.value })}
                      className={`rounded-pill px-2 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}
                      data-testid={`status-select-${r.id}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {r.device} · {r.browser}
                  </td>
                  <td className="p-3 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => setDetail(r)} className="font-semibold text-teal hover:underline">
                        View
                      </button>
                      <button onClick={() => patch(r.id, { archived: !r.archived })} className="text-slate-500 hover:underline">
                        {r.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button onClick={() => remove(r.id)} className="text-red-500 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            {data.total} total · page {data.page} of {data.pages}
          </span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary h-8 px-3 py-0 text-xs disabled:opacity-40">
              ← Prev
            </button>
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary h-8 px-3 py-0 text-xs disabled:opacity-40" data-testid="next-page">
              Next →
            </button>
          </div>
        </div>
      ) : null}

      {detail ? <DetailModal sub={detail} onClose={() => setDetail(null)} onSave={patch} onDelete={remove} /> : null}
    </div>
  );
}

function DetailModal({
  sub,
  onClose,
  onSave,
  onDelete,
}: {
  sub: Submission;
  onClose: () => void;
  onSave: (id: string, body: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(sub.notes);
  const [tags, setTags] = useState(sub.tags.join(', '));
  const [assignedTo, setAssignedTo] = useState(sub.assignedTo ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(sub.id, {
      notes,
      assignedTo: assignedTo || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={<span>{sub.formLabel} submission</span>}>
      <div className="mt-3 max-h-[70vh] space-y-3 overflow-y-auto text-sm">
        <Field label="Name" value={sub.name ?? '—'} />
        <Field label="Email" value={sub.email ?? '—'} />
        <Field label="Phone" value={sub.phone ?? '—'} />
        <Field label="Status" value={sub.status} />
        <Field label="Source URL" value={sub.sourceUrl ?? '—'} />
        <Field label="IP" value={sub.ip ?? '—'} />
        <Field label="Device" value={`${sub.device} · ${sub.os} · ${sub.browser}`} />
        <Field label="Submitted" value={new Date(sub.createdAt).toLocaleString()} />

        {Object.keys(sub.answers).length ? (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Answers</p>
            <pre className="mt-1 max-h-40 overflow-auto rounded-card bg-slate-50 p-3 text-xs text-slate-600">
              {JSON.stringify(sub.answers, null, 2)}
            </pre>
          </div>
        ) : null}

        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-400">Assigned admin</span>
          <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="admin@example.com" className="mt-1 h-9 w-full rounded-pill border border-slate-300 px-4 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-400">Tags (comma-separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hot, follow-up" className="mt-1 h-9 w-full rounded-pill border border-slate-300 px-4 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-400">Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-card border border-slate-300 p-3 text-sm" />
        </label>
      </div>

      <div className="mt-5 flex justify-between gap-3">
        <button
          onClick={() => onDelete(sub.id)}
          className="btn-fx-danger relative overflow-hidden rounded-pill px-3 py-1.5 text-sm font-semibold text-red-500"
        >
          <span className="btn-label">Delete</span>
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60" data-testid="detail-save">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-1">
      <span className="text-xs font-semibold uppercase text-slate-400">{label}</span>
      <span className="break-all text-right text-ink">{value}</span>
    </div>
  );
}
