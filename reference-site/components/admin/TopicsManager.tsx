'use client';

/**
 * Admin Topic Management: analytics (most/least selected, search analytics),
 * a searchable/filterable library with enable/disable + create/delete of custom
 * topics, and CSV/Excel export + CSV bulk import. Writes persist to the
 * Firestore overlay (topicStore) and are audit-logged.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  ALL_TOPICS, AUDIENCES, CATEGORY_COUNT, DIFFICULTIES, MONETIZATIONS, NAV, NICHES, SUBCATEGORY_COUNT, TOPIC_COUNT,
  type Audience, type Difficulty, type EnrichedTopic, type Monetization, type NicheCat,
} from '@/lib/nicheAI/topicEngine';
import { readRecStats, readSearches } from '@/lib/nicheAI/topicStats';
import { TopicWorkflow } from './TopicWorkflow';
import {
  bulkUpsertTopics, deleteCategory, deleteCustomTopic, deleteSubcategory, listCategoryDocs, listSubcategoryDocs,
  loadTopicOverrides, logTopicAudit, reorderCategories, setTopicEnabled, subKey, upsertCategory, upsertCustomTopic,
  upsertSubcategory, type TopicCategoryDoc, type TopicDoc, type TopicStatus, type TopicSubDoc,
} from '@/lib/nicheAI/topicStore';

type Tab = 'analytics' | 'library' | 'categories' | 'workflow' | 'import';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function TopicsManager({ actorEmail, canManage = true }: { actorEmail: string; canManage?: boolean }) {
  const [tab, setTab] = useState<Tab>('analytics');
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [customDocs, setCustomDocs] = useState<TopicDoc[]>([]);
  const [allDocs, setAllDocs] = useState<TopicDoc[]>([]);
  const [catDocs, setCatDocs] = useState<TopicCategoryDoc[]>([]);
  const [subDocs, setSubDocs] = useState<TopicSubDoc[]>([]);
  const [submissions, setSubmissions] = useState<Array<{ answers?: { responses?: { question: string; answer: string }[] } }>>([]);
  const [msg, setMsg] = useState('');

  const loadOverrides = useCallback(async () => {
    const [o, cats, subs] = await Promise.all([loadTopicOverrides(), listCategoryDocs(), listSubcategoryDocs()]);
    setDisabled(o.disabled);
    setCustomDocs(o.docs.filter((d) => d.custom));
    setAllDocs(o.docs);
    setCatDocs(cats);
    setSubDocs(subs);
  }, []);
  useEffect(() => {
    void loadOverrides();
    void fetch('/api/admin/submissions?formKey=niche-assessment&pageSize=100', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setSubmissions(d.rows ?? []))
      .catch(() => setSubmissions([]));
  }, [loadOverrides]);

  const allTopics = useMemo(() => [...ALL_TOPICS, ...customDocs.map((d) => ({ ...d } as unknown as EnrichedTopic))], [customDocs]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold text-ink">Topic Management</h1>
        <span className="rounded-pill bg-teal/15 px-2.5 py-1 text-xs font-semibold text-teal">{TOPIC_COUNT.toLocaleString()} topics</span>
        <a href="/niche-finder" target="_blank" className="text-sm font-semibold text-teal hover:underline">View explorer ↗</a>
      </div>

      {!isFirebaseConfigured ? (
        <div className="mb-4 rounded-card border border-amber/40 bg-amber/10 p-3 text-sm text-amber-dark">
          Firebase is not configured — analytics below read from stored assessments (offline-capable) and exports work,
          but enabling/disabling and creating topics activates once <code>NEXT_PUBLIC_FIREBASE_*</code> is set.
        </div>
      ) : null}
      {msg ? <div className="mb-4 rounded-card bg-teal/10 p-3 text-sm font-semibold text-teal">{msg}</div> : null}

      <div className="mb-4 flex gap-1 rounded-pill bg-slate-100 p-1 text-sm font-semibold">
        {(['analytics', 'library', 'categories', 'workflow', 'import'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-pill px-3 py-1.5 capitalize ${tab === t ? 'bg-white text-ink shadow-soft' : 'text-slate-500'}`}>
            {t === 'import' ? 'Import / Export' : t}
          </button>
        ))}
      </div>

      {tab === 'analytics' ? (
        <Analytics submissions={submissions} />
      ) : tab === 'library' ? (
        <Library
          allTopics={allTopics}
          disabled={disabled}
          canManage={canManage}
          onToggle={async (t, en) => {
            try {
              await setTopicEnabled({ id: t.id, label: t.label, categoryId: t.categoryId, niche: t.niche }, en);
              await logTopicAudit(actorEmail, en ? 'topic.enable' : 'topic.disable', t.id, { label: t.label });
              await loadOverrides();
            } catch { setMsg('Requires Firebase to persist.'); }
          }}
          onDelete={async (t) => {
            if (!confirm(`Delete custom topic "${t.label}"?`)) return;
            try { await deleteCustomTopic(t.id); await logTopicAudit(actorEmail, 'topic.delete', t.id, { label: t.label }); await loadOverrides(); }
            catch { setMsg('Requires Firebase.'); }
          }}
          onCreate={async (t) => {
            try { await upsertCustomTopic(t); await logTopicAudit(actorEmail, 'topic.create', t.id, { label: t.label }); setMsg(`Created “${t.label}”.`); await loadOverrides(); }
            catch { setMsg('Requires Firebase to persist new topics.'); }
          }}
          onEdit={async (t) => {
            try { await upsertCustomTopic(t); await logTopicAudit(actorEmail, 'topic.update', t.id, { label: t.label }); setMsg(`Saved “${t.label}”.`); await loadOverrides(); }
            catch { setMsg('Requires Firebase to persist edits.'); }
          }}
          customIds={new Set(customDocs.map((d) => d.id))}
        />
      ) : tab === 'categories' ? (
        <CategoriesTab
          catDocs={catDocs}
          subDocs={subDocs}
          canManage={canManage}
          onSaveCategory={async (c) => {
            try { await upsertCategory(c); await logTopicAudit(actorEmail, 'topic.category.save', c.id, { name: c.name }); setMsg(`Saved category “${c.name}”.`); await loadOverrides(); }
            catch { setMsg('Requires Firebase to persist categories.'); }
          }}
          onDeleteCategory={async (c) => {
            if (!confirm(`Delete category override "${c.name}"? Built-in categories return to their library defaults.`)) return;
            try { await deleteCategory(c.id); await logTopicAudit(actorEmail, 'topic.category.delete', c.id, { name: c.name }); await loadOverrides(); }
            catch { setMsg('Requires Firebase.'); }
          }}
          onReorder={async (ids) => {
            try { await reorderCategories(ids); await logTopicAudit(actorEmail, 'topic.category.reorder', null, { count: ids.length }); await loadOverrides(); }
            catch { setMsg('Requires Firebase to persist ordering.'); }
          }}
          onSaveSub={async (s) => {
            try { await upsertSubcategory(s); await logTopicAudit(actorEmail, 'topic.subcategory.save', s.id, { name: s.name }); setMsg(`Saved subcategory “${s.name}”.`); await loadOverrides(); }
            catch { setMsg('Requires Firebase to persist subcategories.'); }
          }}
          onDeleteSub={async (s) => {
            if (!confirm(`Delete subcategory override "${s.name}"?`)) return;
            try { await deleteSubcategory(s.id); await logTopicAudit(actorEmail, 'topic.subcategory.delete', s.id, { name: s.name }); await loadOverrides(); }
            catch { setMsg('Requires Firebase.'); }
          }}
        />
      ) : tab === 'workflow' ? (
        <TopicWorkflow
          docs={allDocs}
          actorEmail={actorEmail}
          canManage={canManage}
          canApprove={canManage}
          onChanged={loadOverrides}
          onError={setMsg}
        />
      ) : (
        <ImportExport allTopics={allTopics} canManage={canManage} onImport={async (docs) => {
          try { const n = await bulkUpsertTopics(docs); await logTopicAudit(actorEmail, 'topic.bulk-import', null, { count: n }); setMsg(`Imported ${n} topics.`); await loadOverrides(); }
          catch { setMsg('Requires Firebase to persist imports.'); }
        }} />
      )}

      <p className="mt-6 text-xs text-slate-400">Signed in as {actorEmail}. Changes are role-guarded and audit-logged.</p>
    </div>
  );
}

// ---- Analytics ------------------------------------------------------------

function Analytics({ submissions }: { submissions: Array<{ answers?: { responses?: { question: string; answer: string }[] } }> }) {
  const tally = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of submissions) {
      const resp = (s.answers?.responses ?? []).find((r) => /talk about for hours/i.test(r.question));
      if (resp?.answer && resp.answer !== '—') for (const label of String(resp.answer).split(',').map((x) => x.trim()).filter(Boolean)) m.set(label, (m.get(label) ?? 0) + 1);
    }
    return m;
  }, [submissions]);

  const most = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const least = [...tally.entries()].sort((a, b) => a[1] - b[1]).slice(0, 12);
  const neverSelected = TOPIC_COUNT - tally.size;
  const searches = useMemo(() => Object.entries(readSearches()).sort((a, b) => b[1] - a[1]).slice(0, 12), []);
  const cats = CATEGORY_COUNT;
  const subs = SUBCATEGORY_COUNT;

  const diffDist = useMemo(() => {
    const d: Record<string, number> = {};
    for (const t of ALL_TOPICS) d[t.difficulty] = (d[t.difficulty] ?? 0) + 1;
    return d;
  }, []);

  const kpis = [
    { label: 'Total topics', value: TOPIC_COUNT.toLocaleString() },
    { label: 'Categories', value: cats },
    { label: 'Subcategories', value: subs },
    { label: 'Assessments analysed', value: submissions.length },
    { label: 'Never selected', value: neverSelected.toLocaleString() },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-card border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-extrabold text-ink">{k.value}</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankPanel title="Most selected topics" rows={most} empty="No assessment data yet." accent="bg-teal" />
        <RankPanel title="Least selected (of those chosen)" rows={least} empty="No assessment data yet." accent="bg-amber" />
        <RankPanel title="Top searches" rows={searches} empty="No searches recorded on this device yet." accent="bg-violet" />
        <RecommendationPanel />
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-extrabold text-ink">Difficulty distribution</h3>
          {DIFFICULTIES.map((d) => (
            <div key={d} className="mb-2">
              <div className="mb-1 flex justify-between text-xs font-semibold"><span className="text-ink">{d}</span><span className="text-slate-400">{diffDist[d] ?? 0}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal" style={{ width: `${((diffDist[d] ?? 0) / TOPIC_COUNT) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * AI recommendation analytics — impressions vs acceptances. The accept rate is
 * the honest measure of whether the recommender is helping; a long list of
 * never-accepted suggestions means the model needs tuning, not more surface.
 */
function RecommendationPanel() {
  const stats = useMemo(() => readRecStats(), []);
  const rows = useMemo(() => {
    const ids = new Set([...Object.keys(stats.shown), ...Object.keys(stats.accepted)]);
    return [...ids]
      .map((id) => ({
        id,
        label: ALL_TOPICS.find((t) => t.id === id)?.label ?? id,
        shown: stats.shown[id] ?? 0,
        accepted: stats.accepted[id] ?? 0,
      }))
      .sort((a, b) => b.accepted - a.accepted || b.shown - a.shown)
      .slice(0, 10);
  }, [stats]);

  const totalShown = Object.values(stats.shown).reduce((a, b) => a + b, 0);
  const totalAccepted = Object.values(stats.accepted).reduce((a, b) => a + b, 0);
  const rate = totalShown ? Math.round((totalAccepted / totalShown) * 100) : 0;

  return (
    <div className="rounded-card border border-slate-200 bg-white p-5" data-testid="admin-rec-analytics">
      <h3 className="mb-1 text-sm font-extrabold text-ink">AI recommendation analytics</h3>
      <p className="mb-3 text-xs text-slate-500">
        {totalShown.toLocaleString()} suggestions shown · {totalAccepted.toLocaleString()} accepted ·{' '}
        <strong className="text-ink">{rate}% accept rate</strong>
      </p>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id}>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span className="truncate text-ink">{r.label}</span>
                <span className="ml-2 shrink-0 text-slate-400">{r.accepted}/{r.shown}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-violet" style={{ width: `${r.shown ? (r.accepted / r.shown) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No recommendation activity recorded on this device yet.</p>
      )}
    </div>
  );
}

function RankPanel({ title, rows, empty, accent }: { title: string; rows: [string, number][]; empty: string; accent: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="rounded-card border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-extrabold text-ink">{title}</h3>
      {rows.length ? (
        <div className="space-y-2">
          {rows.map(([label, n]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs font-semibold"><span className="truncate text-ink">{label}</span><span className="ml-2 shrink-0 text-slate-400">{n}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${accent}`} style={{ width: `${(n / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-400">{empty}</p>}
    </div>
  );
}

// ---- Library --------------------------------------------------------------

function Library({
  allTopics, disabled, canManage, customIds, onToggle, onDelete, onCreate, onEdit,
}: {
  allTopics: EnrichedTopic[];
  disabled: Set<string>;
  canManage: boolean;
  customIds: Set<string>;
  onToggle: (t: EnrichedTopic, enabled: boolean) => void;
  onDelete: (t: EnrichedTopic) => void;
  onCreate: (t: TopicDoc) => void;
  onEdit: (t: TopicDoc) => void;
}) {
  const [q, setQ] = useState('');
  const [niche, setNiche] = useState('');
  const [diff, setDiff] = useState('');
  const [shown, setShown] = useState(50);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<EnrichedTopic | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return allTopics.filter((t) =>
      (!s || t.label.toLowerCase().includes(s) || t.parentCategory.toLowerCase().includes(s)) &&
      (!niche || t.niche === niche) &&
      (!diff || t.difficulty === diff),
    );
  }, [allTopics, q, niche, diff]);
  useEffect(() => setShown(50), [q, niche, diff]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search topics…" className="cx-admin-input max-w-xs" />
        <select value={niche} onChange={(e) => setNiche(e.target.value)} className="cx-admin-input w-auto">
          <option value="">All coaching types</option>
          {NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value)} className="cx-admin-input w-auto">
          <option value="">All difficulty</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={() => setAdding(true)} className="btn-primary ml-auto" disabled={!canManage}>+ New topic</button>
      </div>
      <p className="mb-2 text-xs text-slate-400">{filtered.length.toLocaleString()} topics</p>

      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Topic</th><th className="p-3">Category</th><th className="p-3">Coaching</th><th className="p-3">Difficulty</th><th className="p-3" title="Monetization potential">₹</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, shown).map((t) => {
              const en = !disabled.has(t.id);
              return (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3 font-medium text-ink">{t.label}{customIds.has(t.id) ? <span className="ml-1 rounded-pill bg-violet/15 px-1.5 text-[10px] text-violet">custom</span> : null}</td>
                  <td className="p-3 text-xs text-slate-600">{t.parentCategory} › {t.subcategory}</td>
                  <td className="p-3 text-xs text-slate-500">{t.niche}</td>
                  <td className="p-3 text-xs text-slate-500">{t.difficulty}</td>
                  <td className="p-3 text-xs text-slate-500">{t.monetization}</td>
                  <td className="p-3">
                    <button onClick={() => onToggle(t, !en)} disabled={!canManage} className={`rounded-pill px-2 py-1 text-xs font-semibold ${en ? 'bg-teal/15 text-teal' : 'bg-slate-100 text-slate-500'}`}>
                      {en ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-3 text-xs">
                    <button onClick={() => setEditing(t)} disabled={!canManage} className="text-teal hover:underline disabled:opacity-40">Edit</button>
                    {customIds.has(t.id) ? <button onClick={() => onDelete(t)} className="ml-2 text-red-500 hover:underline">Delete</button> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shown < filtered.length ? (
        <div className="mt-3 text-center"><button onClick={() => setShown((s) => s + 100)} className="btn-secondary text-xs">Show more ({filtered.length - shown})</button></div>
      ) : null}

      {adding ? <TopicForm onCancel={() => setAdding(false)} onSave={(t) => { onCreate(t); setAdding(false); }} /> : null}
      {editing ? <TopicForm existing={editing} onCancel={() => setEditing(null)} onSave={(t) => { onEdit(t); setEditing(null); }} /> : null}
    </div>
  );
}

/**
 * Create *or* edit a topic. Editing a built-in library topic writes a full
 * override document keyed by the same id, so the explorer's overlay merge
 * shows the edited version without the code library changing.
 */
function TopicForm({ existing, onCancel, onSave }: { existing?: EnrichedTopic; onCancel: () => void; onSave: (t: TopicDoc) => void }) {
  const [f, setF] = useState({
    label: existing?.label ?? '',
    parentCategory: existing?.parentCategory ?? '',
    subcategory: existing?.subcategory ?? 'General',
    group: existing?.group ?? NAV[0]?.name ?? 'Business',
    niche: (existing?.niche ?? 'business') as NicheCat,
    difficulty: (existing?.difficulty ?? 'Intermediate') as Difficulty,
    monetization: (existing?.monetization ?? 'Medium') as Monetization,
    business: existing?.businessCategory ?? 'Custom',
    audience: (existing?.audience?.[0] ?? 'Individuals') as Audience,
    industry: existing?.industry ?? '',
    description: existing?.description ?? '',
    status: 'published' as TopicStatus,
  });
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  function save() {
    if (!f.label.trim()) return;
    onSave({
      id: existing?.id ?? `custom-${slug(f.label)}-${Date.now().toString(36)}`,
      label: f.label.trim(), group: f.group, parentCategory: f.parentCategory || f.group,
      categoryId: existing?.categoryId ?? slug(f.parentCategory || f.group), subcategory: f.subcategory, niche: f.niche, businessCategory: f.business,
      difficulty: f.difficulty, monetization: f.monetization, audience: [f.audience],
      keywords: existing?.keywords?.length ? existing.keywords : f.label.toLowerCase().split(/\s+/),
      custom: true, enabled: f.status === 'published',
      industry: f.industry || undefined, description: f.description || undefined,
      status: f.status, submittedBy: f.status === 'draft' ? 'admin' : undefined,
    });
  }
  return (
    <Modal open onClose={onCancel} title={<span>{existing ? 'Edit topic' : 'New topic'}</span>}>
      <div className="mt-3 space-y-3">
        <label className="block"><span className="text-xs font-semibold text-slate-600">Label</span><input value={f.label} onChange={(e) => set({ label: e.target.value })} className="cx-admin-input mt-1" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-600">Parent category</span><input value={f.parentCategory} onChange={(e) => set({ parentCategory: e.target.value })} className="cx-admin-input mt-1" placeholder="e.g. Fitness" /></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">Subcategory</span><input value={f.subcategory} onChange={(e) => set({ subcategory: e.target.value })} className="cx-admin-input mt-1" /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-600">Coaching niche</span><select value={f.niche} onChange={(e) => set({ niche: e.target.value as NicheCat })} className="cx-admin-input mt-1">{NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">Group</span><select value={f.group} onChange={(e) => set({ group: e.target.value })} className="cx-admin-input mt-1">{NAV.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}</select></label>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-600">Difficulty</span><select value={f.difficulty} onChange={(e) => set({ difficulty: e.target.value as Difficulty })} className="cx-admin-input mt-1">{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">Monetization</span><select value={f.monetization} onChange={(e) => set({ monetization: e.target.value as Monetization })} className="cx-admin-input mt-1">{MONETIZATIONS.map((m) => <option key={m}>{m}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">Audience</span><select value={f.audience} onChange={(e) => set({ audience: e.target.value as Audience })} className="cx-admin-input mt-1">{AUDIENCES.map((a) => <option key={a}>{a}</option>)}</select></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-600">Industry</span>
            <input value={f.industry} onChange={(e) => set({ industry: e.target.value })} className="cx-admin-input mt-1" placeholder="Defaults to the business model" /></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">Status</span>
            <select value={f.status} onChange={(e) => set({ status: e.target.value as TopicStatus })} className="cx-admin-input mt-1" data-testid="topic-status">
              <option value="published">Published — live in the explorer</option>
              <option value="draft">Draft — not public</option>
              <option value="pending">Pending approval</option>
            </select></label>
        </div>
        <label className="block"><span className="text-xs font-semibold text-slate-600">Description</span>
          <textarea value={f.description} onChange={(e) => set({ description: e.target.value })} rows={2} className="cx-admin-input mt-1" placeholder="Leave blank to generate one from the topic profile" /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onCancel} className="btn-secondary">Cancel</button><button onClick={save} className="btn-primary">{existing ? 'Save changes' : 'Create'}</button></div>
    </Modal>
  );
}

// ---- Categories & subcategories -------------------------------------------

/**
 * Category / subcategory management. The code library is the base taxonomy;
 * everything here is an overlay document, so "delete" removes the override and
 * falls back to the library rather than destroying built-in structure.
 */
function CategoriesTab({
  catDocs, subDocs, canManage, onSaveCategory, onDeleteCategory, onReorder, onSaveSub, onDeleteSub,
}: {
  catDocs: TopicCategoryDoc[];
  subDocs: TopicSubDoc[];
  canManage: boolean;
  onSaveCategory: (c: TopicCategoryDoc) => void;
  onDeleteCategory: (c: TopicCategoryDoc) => void;
  onReorder: (ids: string[]) => void;
  onSaveSub: (s: TopicSubDoc) => void;
  onDeleteSub: (s: TopicSubDoc) => void;
}) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<TopicCategoryDoc | null>(null);
  const [subFor, setSubFor] = useState<{ categoryId: string; name: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const overrideById = useMemo(() => new Map(catDocs.map((c) => [c.id, c])), [catDocs]);
  const subsByCat = useMemo(() => {
    const m = new Map<string, TopicSubDoc[]>();
    for (const s of subDocs) {
      if (!m.has(s.categoryId)) m.set(s.categoryId, []);
      m.get(s.categoryId)!.push(s);
    }
    return m;
  }, [subDocs]);

  // Library categories, ordered by any saved override order.
  const rows = useMemo(() => {
    const base = NAV.flatMap((g) => g.categories.map((c) => ({
      id: c.id, name: c.name, group: g.name, count: c.count, subs: c.subs,
      order: overrideById.get(c.id)?.order ?? 9999,
      enabled: overrideById.get(c.id)?.enabled !== false,
      custom: false,
    })));
    const customOnly = catDocs.filter((c) => c.custom && !base.some((b) => b.id === c.id))
      .map((c) => ({ id: c.id, name: c.name, group: c.group, count: 0, subs: [] as { name: string; count: number }[], order: c.order ?? 9999, enabled: c.enabled !== false, custom: true }));
    const all = [...base, ...customOnly];
    const s = q.trim().toLowerCase();
    return (s ? all.filter((r) => r.name.toLowerCase().includes(s) || r.group.toLowerCase().includes(s)) : all)
      .sort((a, b) => a.order - b.order || a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
  }, [catDocs, overrideById, q]);

  function move(idx: number, dir: -1 | 1) {
    const next = [...rows];
    const to = idx + dir;
    if (to < 0 || to >= next.length) return;
    [next[idx], next[to]] = [next[to], next[idx]];
    onReorder(next.map((r) => r.id));
  }

  const toDoc = (r: (typeof rows)[number]): TopicCategoryDoc => ({
    id: r.id, name: r.name, group: r.group, niche: 'business', business: 'Custom',
    enabled: r.enabled, order: r.order === 9999 ? 0 : r.order, custom: r.custom,
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search categories…" className="cx-admin-input max-w-xs" />
        <span className="text-xs text-slate-400">{CATEGORY_COUNT} categories · {SUBCATEGORY_COUNT} subcategories</span>
        <button
          onClick={() => setEditing({ id: '', name: '', group: NAV[0]?.name ?? 'Business', niche: 'business', business: 'Custom', enabled: true, order: 0, custom: true })}
          className="btn-primary ml-auto"
          disabled={!canManage}
        >
          + New category
        </button>
      </div>

      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Order</th><th className="p-3">Category</th><th className="p-3">Group</th><th className="p-3">Topics</th><th className="p-3">Subs</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const subs = subsByCat.get(r.id) ?? [];
              return (
                <tr key={r.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => move(i, -1)} disabled={!canManage || i === 0} className="text-xs text-slate-400 hover:text-teal disabled:opacity-30" aria-label={`Move ${r.name} up`}>▲</button>
                      <button onClick={() => move(i, 1)} disabled={!canManage || i === rows.length - 1} className="text-xs text-slate-400 hover:text-teal disabled:opacity-30" aria-label={`Move ${r.name} down`}>▼</button>
                    </div>
                  </td>
                  <td className="p-3 font-medium text-ink">
                    {r.name}
                    {r.custom ? <span className="ml-1 rounded-pill bg-violet/15 px-1.5 text-[10px] text-violet">custom</span> : null}
                    <button
                      onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}
                      className="ml-2 text-[11px] font-semibold text-teal hover:underline"
                    >
                      {expanded[r.id] ? 'hide subs' : 'subs'}
                    </button>
                    {expanded[r.id] ? (
                      <div className="mt-2 space-y-1 border-l border-slate-200 pl-2">
                        {r.subs.map((s) => {
                          const ov = subs.find((x) => x.id === subKey(r.id, s.name));
                          return (
                            <div key={s.name} className="flex items-center gap-2 text-xs">
                              <span className={ov?.enabled === false ? 'text-slate-400 line-through' : 'text-slate-600'}>{ov?.label || s.name}</span>
                              <span className="text-slate-400">{s.count}</span>
                              <button
                                onClick={() => onSaveSub({ id: subKey(r.id, s.name), categoryId: r.id, name: s.name, label: ov?.label ?? s.name, enabled: ov?.enabled === false, order: ov?.order ?? 0, custom: false })}
                                disabled={!canManage}
                                className="text-[11px] text-slate-400 hover:text-teal disabled:opacity-40"
                              >
                                {ov?.enabled === false ? 'enable' : 'disable'}
                              </button>
                              <button onClick={() => setSubFor({ categoryId: r.id, name: s.name })} disabled={!canManage} className="text-[11px] text-teal hover:underline disabled:opacity-40">rename</button>
                            </div>
                          );
                        })}
                        {subs.filter((s) => s.custom).map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-600">{s.label || s.name}</span>
                            <span className="rounded-pill bg-violet/15 px-1.5 text-[10px] text-violet">custom</span>
                            <button onClick={() => onDeleteSub(s)} disabled={!canManage} className="text-[11px] text-red-500 hover:underline disabled:opacity-40">delete</button>
                          </div>
                        ))}
                        <button onClick={() => setSubFor({ categoryId: r.id, name: '' })} disabled={!canManage} className="text-[11px] font-semibold text-teal hover:underline disabled:opacity-40">+ add subcategory</button>
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3 text-xs text-slate-500">{r.group}</td>
                  <td className="p-3 text-xs text-slate-500">{r.count.toLocaleString()}</td>
                  <td className="p-3 text-xs text-slate-500">{r.subs.length || subs.length}</td>
                  <td className="p-3">
                    <button
                      onClick={() => onSaveCategory({ ...toDoc(r), enabled: !r.enabled })}
                      disabled={!canManage}
                      className={`rounded-pill px-2 py-1 text-xs font-semibold ${r.enabled ? 'bg-teal/15 text-teal' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {r.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-3 text-xs">
                    <button onClick={() => setEditing(toDoc(r))} disabled={!canManage} className="text-teal hover:underline disabled:opacity-40">Edit</button>
                    {overrideById.has(r.id) ? (
                      <button onClick={() => onDeleteCategory(toDoc(r))} disabled={!canManage} className="ml-2 text-red-500 hover:underline disabled:opacity-40">Reset</button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing ? (
        <CategoryForm
          existing={editing}
          onCancel={() => setEditing(null)}
          onSave={(c) => { onSaveCategory(c); setEditing(null); }}
        />
      ) : null}
      {subFor ? (
        <SubcategoryForm
          categoryId={subFor.categoryId}
          existingName={subFor.name}
          onCancel={() => setSubFor(null)}
          onSave={(s) => { onSaveSub(s); setSubFor(null); }}
        />
      ) : null}
    </div>
  );
}

function CategoryForm({ existing, onCancel, onSave }: { existing: TopicCategoryDoc; onCancel: () => void; onSave: (c: TopicCategoryDoc) => void }) {
  const [f, setF] = useState<TopicCategoryDoc>(existing);
  const set = (p: Partial<TopicCategoryDoc>) => setF((x) => ({ ...x, ...p }));
  const isNew = !existing.id;
  return (
    <Modal open onClose={onCancel} title={<span>{isNew ? 'New category' : 'Edit category'}</span>}>
      <div className="mt-3 space-y-3">
        <label className="block"><span className="text-xs font-semibold text-slate-600">Name</span>
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} className="cx-admin-input mt-1" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-600">Group</span>
            <select value={f.group} onChange={(e) => set({ group: e.target.value })} className="cx-admin-input mt-1">
              {NAV.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
            </select></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">Coaching niche</span>
            <select value={f.niche} onChange={(e) => set({ niche: e.target.value as NicheCat })} className="cx-admin-input mt-1">
              {NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs font-semibold text-slate-600">Business category</span>
            <input value={f.business} onChange={(e) => set({ business: e.target.value })} className="cx-admin-input mt-1" /></label>
          <label className="block"><span className="text-xs font-semibold text-slate-600">Order</span>
            <input type="number" value={f.order} onChange={(e) => set({ order: Number(e.target.value) })} className="cx-admin-input mt-1" /></label>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          onClick={() => { if (f.name.trim()) onSave({ ...f, id: f.id || slug(f.name), custom: isNew ? true : f.custom }); }}
          className="btn-primary"
        >
          {isNew ? 'Create' : 'Save changes'}
        </button>
      </div>
    </Modal>
  );
}

function SubcategoryForm({ categoryId, existingName, onCancel, onSave }: { categoryId: string; existingName: string; onCancel: () => void; onSave: (s: TopicSubDoc) => void }) {
  const [label, setLabel] = useState(existingName);
  const [order, setOrder] = useState(0);
  const isNew = !existingName;
  return (
    <Modal open onClose={onCancel} title={<span>{isNew ? 'New subcategory' : 'Rename subcategory'}</span>}>
      <div className="mt-3 space-y-3">
        <label className="block"><span className="text-xs font-semibold text-slate-600">{isNew ? 'Name' : 'Display name'}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="cx-admin-input mt-1" autoFocus /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-600">Order</span>
          <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="cx-admin-input mt-1" /></label>
        {!isNew ? <p className="text-xs text-slate-400">Renaming sets a display label. The underlying topics keep their ids, so saved selections stay intact.</p> : null}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button
          onClick={() => {
            const name = existingName || label.trim();
            if (!name) return;
            onSave({ id: subKey(categoryId, name), categoryId, name, label: label.trim() || name, enabled: true, order, custom: isNew });
          }}
          className="btn-primary"
        >
          {isNew ? 'Create' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

// ---- Import / Export ------------------------------------------------------

function ImportExport({ allTopics, canManage, onImport }: { allTopics: EnrichedTopic[]; canManage: boolean; onImport: (docs: TopicDoc[]) => void }) {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<TopicDoc[]>([]);
  const [err, setErr] = useState('');

  const COLS = ['id', 'label', 'group', 'parentCategory', 'subcategory', 'niche', 'businessCategory', 'difficulty', 'monetization', 'audience', 'keywords'] as const;

  function save(content: string, mime: string, ext: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `coachx-topics.${ext}`; a.click(); URL.revokeObjectURL(url);
  }
  function matrix() {
    const head = [...COLS];
    const rows = allTopics.map((t) => [t.id, t.label, t.group, t.parentCategory, t.subcategory, t.niche, t.businessCategory, t.difficulty, t.monetization, t.audience.join('|'), t.keywords.join('|')]);
    return [head, ...rows];
  }
  function exportCsv() { save(matrix().map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv', 'csv'); }
  function exportExcel() {
    const rows = matrix().map((r, i) => `<tr>${r.map((c) => `<${i ? 'td' : 'th'}>${String(c)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('');
    save(`<html><head><meta charset="utf-8"></head><body><table border="1">${rows}</table></body></html>`, 'application/vnd.ms-excel', 'xls');
  }

  function parse() {
    setErr('');
    try {
      const lines = csv.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error('Add a header row and at least one topic.');
      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const idx = (name: string) => header.indexOf(name);
      const docs: TopicDoc[] = lines.slice(1).map((line) => {
        const cells = (line.match(/("([^"]|"")*"|[^,]*)/g) ?? []).filter((_, i, arr) => i < arr.length).map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
        const get = (n: string, d = '') => (idx(n) >= 0 ? cells[idx(n)] ?? d : d);
        const label = get('label');
        return {
          id: get('id') || `custom-${slug(label)}-${Math.random().toString(36).slice(2, 6)}`,
          label, group: get('group') || 'Business', parentCategory: get('parentCategory') || get('group') || 'Custom',
          categoryId: slug(get('parentCategory') || get('group') || 'custom'), subcategory: get('subcategory') || 'General',
          niche: (get('niche') || 'business') as NicheCat, businessCategory: get('businessCategory') || 'Custom',
          difficulty: (get('difficulty') || 'Intermediate') as Difficulty, monetization: (get('monetization') || 'Medium') as Monetization,
          audience: (get('audience') || 'Individuals').split('|') as Audience[], keywords: (get('keywords') || label).split('|'),
          custom: true, enabled: true,
        };
      }).filter((d) => d.label);
      if (!docs.length) throw new Error('No valid rows found.');
      setPreview(docs);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not parse CSV.');
      setPreview([]);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">Export</h3>
        <p className="mt-1 text-xs text-slate-500">Download the full topic library ({allTopics.length.toLocaleString()} topics) with all metadata.</p>
        <div className="mt-3 flex gap-2">
          <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
          <button onClick={exportExcel} className="btn-secondary">Export Excel</button>
        </div>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">Bulk import</h3>
        <p className="mt-1 text-xs text-slate-500">Paste CSV with a header row. Columns: <code className="text-[11px]">{COLS.join(', ')}</code> (only <code>label</code> is required).</p>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} placeholder={`label,group,parentCategory,niche,difficulty\nPodcast editing,Creative & Content,Video & Podcasting,creative,Intermediate`} className="cx-admin-input mt-2 font-mono text-xs" />
        {err ? <p className="mt-1 text-xs text-red-500">{err}</p> : null}
        <div className="mt-3 flex gap-2">
          <button onClick={parse} className="btn-secondary">Preview</button>
          <button onClick={() => onImport(preview)} disabled={!preview.length || !canManage} className="btn-primary disabled:opacity-50">Import {preview.length || ''} topics</button>
        </div>
        {preview.length ? <p className="mt-2 text-xs text-teal">Parsed {preview.length} topics — e.g. “{preview[0].label}” ({preview[0].niche}).</p> : null}
      </div>
    </div>
  );
}
