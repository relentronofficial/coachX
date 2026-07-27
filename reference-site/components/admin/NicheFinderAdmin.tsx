'use client';

/**
 * Admin manager for the AI Niche Finder — question & category CRUD (create,
 * edit, enable/disable, reorder, scoring), results viewer with CSV export, and
 * a one-click Firestore seeder. Writes go through the client Firestore layer,
 * enforced by security rules (admins only). Falls back to the in-code seed for
 * display when Firebase is not configured.
 */

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  deleteQuestion,
  getSettings,
  listAllResults,
  listAnalytics,
  loadCategories,
  loadQuestions,
  saveSettings,
  seedFirestore,
  upsertCategory,
  upsertQuestion,
  type AnalyticsRow,
  type HistoryRow,
} from '@/lib/nicheAI/firestore';
import { DEFAULT_SETTINGS, type NicheSettings, type Question, type QuestionCategory, type QuestionType, type ScoringWeights } from '@/lib/nicheAI/types';
import { TopicsManager } from './TopicsManager';

type Tab = 'questions' | 'categories' | 'topics' | 'results' | 'analytics' | 'settings';
const TYPES: QuestionType[] = ['single', 'multi', 'multiSelect', 'scale', 'ranking', 'tags', 'text'];

export function NicheFinderAdmin({ actorEmail, canManage = true }: { actorEmail: string; canManage?: boolean }) {
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [results, setResults] = useState<HistoryRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [settings, setSettings] = useState<NicheSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Question | null>(null);
  const [editingCat, setEditingCat] = useState<QuestionCategory | null>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const [qs, cats, res, ana, set] = await Promise.all([loadQuestions(), loadCategories(), listAllResults(), listAnalytics(), getSettings()]);
    setQuestions(qs.sort((a, b) => a.order - b.order));
    setCategories(cats.sort((a, b) => a.order - b.order));
    setResults(res);
    setAnalytics(ana);
    setSettings(set);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function save(q: Question) {
    await upsertQuestion(q);
    setEditing(null);
    setMsg('Question saved.');
    await load();
  }
  async function toggleEnabled(q: Question) {
    await upsertQuestion({ ...q, enabled: !q.enabled });
    await load();
  }
  async function reorder(q: Question, dir: -1 | 1) {
    const sorted = [...questions].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((x) => x.id === q.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    await Promise.all([upsertQuestion({ ...sorted[i], order: sorted[j].order }), upsertQuestion({ ...sorted[j], order: sorted[i].order })]);
    await load();
  }
  async function remove(q: Question) {
    if (!confirm(`Delete question "${q.title}"?`)) return;
    await deleteQuestion(q.id);
    await load();
  }
  async function seed() {
    if (!confirm('Push the built-in seed questions & categories into Firestore?')) return;
    const r = await seedFirestore();
    setMsg(`Seeded ${r.questions} questions and ${r.categories} categories.`);
    await load();
  }
  async function persistSettings(s: NicheSettings) {
    setSettings(s);
    try {
      await saveSettings(s);
      setMsg('Settings saved.');
    } catch {
      setMsg('Settings could not be saved (Firebase not configured).');
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold text-ink">AI Niche Finder</h1>
        <a href="/niche-finder" target="_blank" className="text-sm font-semibold text-teal hover:underline">
          View public tool ↗
        </a>
        <button onClick={seed} className="btn-secondary" disabled={!isFirebaseConfigured}>
          Seed Firestore
        </button>
      </div>

      {!isFirebaseConfigured ? (
        <div className="mb-4 rounded-card border border-amber/40 bg-amber/10 p-3 text-sm text-amber-dark">
          Firebase is not configured in this environment. The tables below show the built-in seed; editing/persistence
          activates once <code>NEXT_PUBLIC_FIREBASE_*</code> is set and the security rules are deployed.
        </div>
      ) : null}
      {msg ? <div className="mb-4 rounded-card bg-teal/10 p-3 text-sm font-semibold text-teal">{msg}</div> : null}

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-pill bg-slate-100 p-1 text-sm font-semibold">
        {(['questions', 'categories', 'topics', 'results', 'analytics', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 whitespace-nowrap rounded-pill px-3 py-1.5 capitalize ${tab === t ? 'bg-white text-ink shadow-soft' : 'text-slate-500'}`}
          >
            {t} {t === 'results' ? `(${results.length})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-slate-400">Loading…</p>
      ) : tab === 'questions' ? (
        <QuestionsTable
          questions={questions}
          categories={categories}
          onNew={() => setEditing(newQuestion(categories, questions))}
          onEdit={setEditing}
          onToggle={toggleEnabled}
          onReorder={reorder}
          onRemove={remove}
        />
      ) : tab === 'categories' ? (
        <CategoriesTable categories={categories} onEdit={setEditingCat} />
      ) : tab === 'topics' ? (
        <TopicsManager actorEmail={actorEmail} canManage={canManage} />
      ) : tab === 'analytics' ? (
        <AnalyticsTab results={results} analytics={analytics} />
      ) : tab === 'settings' ? (
        <SettingsTab settings={settings} canManage={canManage} onSave={persistSettings} />
      ) : (
        <ResultsTable results={results} />
      )}

      {editing ? <QuestionEditor value={editing} categories={categories} onCancel={() => setEditing(null)} onSave={save} /> : null}
      {editingCat ? (
        <CategoryEditor
          value={editingCat}
          onCancel={() => setEditingCat(null)}
          onSave={async (c) => {
            await upsertCategory(c);
            setEditingCat(null);
            await load();
          }}
        />
      ) : null}

      <p className="mt-6 text-xs text-slate-400">Signed in as {actorEmail}. All changes are role-guarded by Firestore rules.</p>
    </div>
  );
}

function newQuestion(cats: QuestionCategory[], existing: Question[]): Question {
  return {
    id: `q_${Date.now().toString(36)}`,
    categoryId: cats[0]?.id ?? 'passion',
    type: 'single',
    title: '',
    order: (existing.at(-1)?.order ?? existing.length) + 1,
    enabled: true,
    options: [],
  };
}

function QuestionsTable({
  questions,
  categories,
  onNew,
  onEdit,
  onToggle,
  onReorder,
  onRemove,
}: {
  questions: Question[];
  categories: QuestionCategory[];
  onNew: () => void;
  onEdit: (q: Question) => void;
  onToggle: (q: Question) => void;
  onReorder: (q: Question, d: -1 | 1) => void;
  onRemove: (q: Question) => void;
}) {
  const catName = (id: string) => categories.find((c) => c.id === id)?.title ?? id;
  const [search, setSearch] = useState('');
  const shown = questions.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return q.title.toLowerCase().includes(s) || q.type.includes(s) || catName(q.categoryId).toLowerCase().includes(s);
  });
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search questions…"
          aria-label="Search questions"
          className="cx-admin-input max-w-xs"
        />
        <button onClick={onNew} className="btn-primary ml-auto">
          + New question
        </button>
      </div>
      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Type</th>
              <th className="p-3">Enabled</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((q) => (
              <tr key={q.id} className="border-b border-slate-100 last:border-0">
                <td className="p-3 text-slate-400">
                  <div className="flex flex-col">
                    <button onClick={() => onReorder(q, -1)} className="text-xs hover:text-teal">▲</button>
                    <button onClick={() => onReorder(q, 1)} className="text-xs hover:text-teal">▼</button>
                  </div>
                </td>
                <td className="max-w-xs p-3 font-medium text-ink">{q.title || <span className="italic text-slate-400">Untitled</span>}</td>
                <td className="p-3 text-slate-600">{catName(q.categoryId)}</td>
                <td className="p-3"><span className="rounded-pill bg-slate-100 px-2 py-0.5 text-xs">{q.type}</span></td>
                <td className="p-3">
                  <button
                    onClick={() => onToggle(q)}
                    className={`rounded-pill px-2 py-1 text-xs font-semibold ${q.enabled ? 'bg-teal/15 text-teal' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {q.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => onEdit(q)} className="font-semibold text-teal hover:underline">Edit</button>
                    <button onClick={() => onRemove(q)} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuestionEditor({
  value,
  categories,
  onCancel,
  onSave,
}: {
  value: Question;
  categories: QuestionCategory[];
  onCancel: () => void;
  onSave: (q: Question) => void;
}) {
  const [q, setQ] = useState<Question>({ ...value });
  const set = (patch: Partial<Question>) => setQ((prev) => ({ ...prev, ...patch }));
  const [optionsJson, setOptionsJson] = useState(JSON.stringify(q.options ?? [], null, 2));
  const [jsonErr, setJsonErr] = useState('');

  const needsOptions = ['single', 'multi', 'multiSelect', 'ranking'].includes(q.type);
  const needsScale = q.type === 'scale';

  function submit() {
    let options = q.options;
    if (needsOptions) {
      try {
        options = JSON.parse(optionsJson);
        setJsonErr('');
      } catch {
        setJsonErr('Options must be valid JSON.');
        return;
      }
    }
    onSave({ ...q, options });
  }

  return (
    <Modal open onClose={onCancel} title={<span>{value.title ? 'Edit question' : 'New question'}</span>}>
      <div className="mt-3 space-y-3">
        <Field label="Title">
          <input value={q.title} onChange={(e) => set({ title: e.target.value })} className="cx-admin-input" />
        </Field>
        <Field label="Help text">
          <input value={q.help ?? ''} onChange={(e) => set({ help: e.target.value })} className="cx-admin-input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={q.categoryId} onChange={(e) => set({ categoryId: e.target.value })} className="cx-admin-input">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select value={q.type} onChange={(e) => set({ type: e.target.value as QuestionType })} className="cx-admin-input">
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Order"><input type="number" value={q.order} onChange={(e) => set({ order: Number(e.target.value) })} className="cx-admin-input" /></Field>
          <Field label="Min"><input type="number" value={q.min ?? 0} onChange={(e) => set({ min: Number(e.target.value) })} className="cx-admin-input" /></Field>
          <Field label="Required">
            <select value={String(q.required ?? true)} onChange={(e) => set({ required: e.target.value === 'true' })} className="cx-admin-input">
              <option value="true">Required</option>
              <option value="false">Optional</option>
            </select>
          </Field>
        </div>

        {needsScale ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Scale min"><input type="number" value={q.scale?.min ?? 1} onChange={(e) => set({ scale: { ...(q.scale ?? { min: 1, max: 5, minLabel: '', maxLabel: '' }), min: Number(e.target.value) } })} className="cx-admin-input" /></Field>
            <Field label="Scale max"><input type="number" value={q.scale?.max ?? 5} onChange={(e) => set({ scale: { ...(q.scale ?? { min: 1, max: 5, minLabel: '', maxLabel: '' }), max: Number(e.target.value) } })} className="cx-admin-input" /></Field>
          </div>
        ) : null}

        {needsOptions ? (
          <Field label="Options + scoring (JSON)">
            <textarea
              value={optionsJson}
              onChange={(e) => setOptionsJson(e.target.value)}
              rows={8}
              className="cx-admin-input font-mono text-xs"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-slate-400">
              Each: {`{ "value", "label", "dimensions": {"passion":4}, "categories": {"business":3} }`}
            </p>
            {jsonErr ? <p className="text-xs text-red-500">{jsonErr}</p> : null}
          </Field>
        ) : null}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={submit} className="btn-primary">Save</button>
      </div>
    </Modal>
  );
}

function CategoriesTable({ categories, onEdit }: { categories: QuestionCategory[]; onEdit: (c: QuestionCategory) => void }) {
  return (
    <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
      <table className="w-full min-w-[520px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="p-3">Order</th>
            <th className="p-3">Category</th>
            <th className="p-3">Dimension</th>
            <th className="p-3">Enabled</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-slate-100 last:border-0">
              <td className="p-3 text-slate-400">{c.order}</td>
              <td className="p-3 font-medium text-ink">{c.icon} {c.title}</td>
              <td className="p-3 text-slate-600">{c.dimension}</td>
              <td className="p-3">{c.enabled ? '✅' : '—'}</td>
              <td className="p-3"><button onClick={() => onEdit(c)} className="text-xs font-semibold text-teal hover:underline">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryEditor({ value, onCancel, onSave }: { value: QuestionCategory; onCancel: () => void; onSave: (c: QuestionCategory) => void }) {
  const [c, setC] = useState<QuestionCategory>({ ...value });
  const set = (patch: Partial<QuestionCategory>) => setC((prev) => ({ ...prev, ...patch }));
  return (
    <Modal open onClose={onCancel} title={<span>Edit category</span>}>
      <div className="mt-3 space-y-3">
        <Field label="Title"><input value={c.title} onChange={(e) => set({ title: e.target.value })} className="cx-admin-input" /></Field>
        <Field label="Description"><input value={c.description} onChange={(e) => set({ description: e.target.value })} className="cx-admin-input" /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Icon"><input value={c.icon} onChange={(e) => set({ icon: e.target.value })} className="cx-admin-input" /></Field>
          <Field label="Order"><input type="number" value={c.order} onChange={(e) => set({ order: Number(e.target.value) })} className="cx-admin-input" /></Field>
          <Field label="Enabled">
            <select value={String(c.enabled)} onChange={(e) => set({ enabled: e.target.value === 'true' })} className="cx-admin-input">
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </Field>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={() => onSave(c)} className="btn-primary">Save</button>
      </div>
    </Modal>
  );
}

function ResultsTable({ results }: { results: HistoryRow[] }) {
  const [search, setSearch] = useState('');
  const shown = useMemo(
    () => results.filter((r) => !search || (r.recommendations[0]?.title ?? '').toLowerCase().includes(search.toLowerCase()) || (r.uid ?? '').includes(search)),
    [results, search],
  );

  const matrix = useMemo(() => {
    const head = ['id', 'uid', 'topNiche', 'category', 'headlineScore', 'confidence', 'engine'];
    const rows = shown.map((r) => [
      r._id,
      r.uid ?? '',
      r.recommendations[0]?.title ?? '',
      r.recommendations[0]?.categoryName ?? '',
      r.headlineScore,
      r.headlineConfidence,
      r.meta?.engine ?? '',
    ]);
    return [head, ...rows];
  }, [shown]);

  function save(content: string, mime: string, ext: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `niche-results.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportCsv() {
    save(matrix.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv', 'csv');
  }
  function exportExcel() {
    // Excel opens an HTML table with the ms-excel mime directly (no dependency).
    const rows = matrix.map((row, i) => `<tr>${row.map((c) => `<${i ? 'td' : 'th'}>${String(c)}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('');
    save(`<html><head><meta charset="utf-8"></head><body><table border="1">${rows}</table></body></html>`, 'application/vnd.ms-excel', 'xls');
  }

  if (!results.length) return <p className="rounded-card border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">No results yet. Completed assessments appear here (requires Firebase).</p>;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search results…" aria-label="Search results" className="cx-admin-input max-w-xs" />
        <div className="ml-auto flex gap-2">
          <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
          <button onClick={exportExcel} className="btn-secondary">Export Excel</button>
          <button onClick={() => window.print()} className="btn-secondary">Print / PDF</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Top niche</th>
              <th className="p-3">Category</th>
              <th className="p-3">Score</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">User</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r._id} className="border-b border-slate-100 last:border-0">
                <td className="p-3 font-medium text-ink">{r.recommendations[0]?.title ?? '—'}</td>
                <td className="p-3 text-slate-600">{r.recommendations[0]?.categoryName ?? '—'}</td>
                <td className="p-3 text-slate-600">{r.headlineScore}</td>
                <td className="p-3 text-slate-600">{r.headlineConfidence}%</td>
                <td className="p-3 font-mono text-xs text-slate-400">{r.uid ?? '—'}</td>
              </tr>
            ))}
            {!shown.length ? <tr><td colSpan={5} className="p-6 text-center text-slate-400">No matches.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Analytics ------------------------------------------------------------

function AnalyticsTab({ results, analytics }: { results: HistoryRow[]; analytics: AnalyticsRow[] }) {
  const started = analytics.filter((a) => a.type === 'assessment_started').length;
  const completed = analytics.filter((a) => a.type === 'assessment_completed').length || results.length;
  const emailed = analytics.filter((a) => a.type === 'result_emailed').length;
  const completionRate = started ? Math.round((completed / started) * 100) : results.length ? 100 : 0;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.headlineScore, 0) / results.length) : 0;

  const topNiches = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const r of results) {
      const t = r.recommendations[0]?.title ?? '—';
      tally[t] = (tally[t] ?? 0) + 1;
    }
    return Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [results]);
  const maxNiche = Math.max(1, ...topNiches.map(([, n]) => n));

  const dist = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0]; // 0-20,...,80-100
    for (const r of results) buckets[Math.min(4, Math.floor(r.headlineScore / 20))]++;
    return buckets;
  }, [results]);
  const maxDist = Math.max(1, ...dist);

  const kpis = [
    { label: 'Assessments started', value: started || results.length },
    { label: 'Completed', value: completed },
    { label: 'Completion rate', value: `${completionRate}%` },
    { label: 'Avg. niche score', value: avgScore },
    { label: 'Emailed reports', value: emailed },
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
        <div className="rounded-card border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-extrabold text-ink">Top recommended niches</h3>
          {topNiches.length ? (
            <div className="space-y-2">
              {topNiches.map(([name, n]) => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-xs font-semibold"><span className="text-ink">{name}</span><span className="text-slate-400">{n}</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal" style={{ width: `${(n / maxNiche) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No data yet.</p>}
        </div>

        <div className="rounded-card border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-extrabold text-ink">Score distribution</h3>
          <div className="flex h-40 items-end gap-2">
            {dist.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t bg-amber" style={{ height: `${(n / maxDist) * 100}%`, minHeight: n ? 6 : 0 }} />
                <span className="text-[10px] text-slate-400">{i * 20}–{i * 20 + 20}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isFirebaseConfigured ? (
        <p className="text-xs text-slate-400">Live analytics (started/completed funnel, over-time) populate from the <code>analytics</code> collection once Firebase is connected. Score/niche breakdowns above reflect stored results.</p>
      ) : null}
    </div>
  );
}

// ---- Settings -------------------------------------------------------------

const WEIGHT_KEYS: { key: keyof ScoringWeights; label: string }[] = [
  { key: 'match', label: 'Interest match' },
  { key: 'passion', label: 'Passion fit' },
  { key: 'skill', label: 'Skill match' },
  { key: 'profitability', label: 'Profitability' },
  { key: 'demand', label: 'Demand' },
  { key: 'competition', label: 'Low competition' },
  { key: 'difficultyPenalty', label: 'Difficulty penalty' },
];

function SettingsTab({ settings, canManage, onSave }: { settings: NicheSettings; canManage: boolean; onSave: (s: NicheSettings) => void }) {
  const [s, setS] = useState<NicheSettings>(settings);
  const set = (patch: Partial<NicheSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const setWeight = (k: keyof ScoringWeights, v: number) => setS((prev) => ({ ...prev, weights: { ...prev.weights, [k]: v } }));

  return (
    <div className="max-w-2xl space-y-6">
      {!canManage ? <p className="rounded-card bg-amber/10 p-3 text-sm text-amber-dark">You can view settings but need the <code>settings.manage</code> permission to change them.</p> : null}

      <section className="rounded-card border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">Scoring weights</h3>
        <p className="mt-1 text-xs text-slate-500">Tune how the intelligence engine weighs each factor. Applied to new assessments.</p>
        <div className="mt-4 space-y-3">
          {WEIGHT_KEYS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3">
              <span className="w-36 text-sm text-ink">{label}</span>
              <input type="range" min={0} max={0.5} step={0.01} value={s.weights[key]} disabled={!canManage} onChange={(e) => setWeight(key, Number(e.target.value))} className="flex-1" />
              <span className="w-12 text-right text-xs font-semibold text-slate-500">{Math.round(s.weights[key] * 100)}%</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">AI prompt template</h3>
        <p className="mt-1 text-xs text-slate-500">Reserved for a future live-LLM pass. Supports <code>{'{{profile}}'}</code> and <code>{'{{niche}}'}</code>.</p>
        <textarea value={s.promptTemplate} disabled={!canManage} onChange={(e) => set({ promptTemplate: e.target.value })} rows={4} className="cx-admin-input mt-2 font-mono text-xs" />
      </section>

      <section className="rounded-card border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-extrabold text-ink">Notifications</h3>
        <div className="mt-3 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.emailOnComplete} disabled={!canManage} onChange={(e) => set({ emailOnComplete: e.target.checked })} /> Auto-email the report on completion</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={s.remindersEnabled} disabled={!canManage} onChange={(e) => set({ remindersEnabled: e.target.checked })} /> Send reminders for unfinished assessments</label>
          <label className="flex items-center gap-3">Pass threshold
            <input type="number" min={0} max={100} value={s.passThreshold} disabled={!canManage} onChange={(e) => set({ passThreshold: Number(e.target.value) })} className="cx-admin-input w-20" />
          </label>
        </div>
      </section>

      <div className="flex gap-2">
        <button onClick={() => onSave(s)} disabled={!canManage} className="btn-primary disabled:opacity-50">Save settings</button>
        <button onClick={() => setS(DEFAULT_SETTINGS)} disabled={!canManage} className="btn-secondary">Reset defaults</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
