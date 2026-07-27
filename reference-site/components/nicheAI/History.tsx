'use client';

/**
 * "My results" — history dashboard with search/filter, favourites, trend chart,
 * open/compare/delete/download. Merges Firestore (source of truth when
 * configured) with a local mirror so it works offline too.
 */

import { useEffect, useMemo, useState } from 'react';
import type { AnalysisResult } from '@/lib/nicheAI/types';
import { deleteResult, listHistory, listUserReports, setFavourite } from '@/lib/nicheAI/firestore';
import { addLocalResult, readFavourites, readLocalHistory, removeLocalResult, toggleLocalFavourite, type LocalResult } from '@/lib/nicheAI/localHistory';
import { TrendLine } from './Charts';

interface Row extends AnalysisResult {
  _id: string;
  favourite: boolean;
  reportId?: string;
  savedAt?: string;
}

export function History({
  uid,
  onOpen,
  onCompare,
  onRetake,
  onBack,
}: {
  uid: string | null;
  onOpen: (r: AnalysisResult) => void;
  onCompare: (a: AnalysisResult, b: AnalysisResult) => void;
  onRetake: () => void;
  onBack: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      // Firestore (if signed in) + local mirror, deduped by id.
      const [remote, reports] = await Promise.all([uid ? listHistory(uid) : Promise.resolve([]), uid ? listUserReports(uid) : Promise.resolve([])]);
      const favByResult = new Map(reports.map((r) => [r.resultId, { fav: r.favourite, id: r.id }]));
      const local = readLocalHistory();
      const localFavs = readFavourites();
      const byId = new Map<string, Row>();
      for (const r of local as LocalResult[]) byId.set(r._id, { ...r, favourite: localFavs.has(r._id) });
      for (const r of remote) {
        const meta = favByResult.get(r._id) ?? favByResult.get((r as AnalysisResult).id);
        byId.set(r._id, { ...r, favourite: meta?.fav ?? localFavs.has(r._id), reportId: meta?.id });
      }
      if (!active) return;
      setRows([...byId.values()]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [uid]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (favOnly ? r.favourite : true))
      .filter((r) => r.headlineScore >= minScore)
      .filter((r) => {
        if (!search) return true;
        const hay = (r.recommendations[0]?.title ?? '').toLowerCase();
        return hay.includes(search.toLowerCase());
      });
  }, [rows, favOnly, minScore, search]);

  const trend = useMemo(
    () => [...rows].reverse().map((r, i) => ({ label: `#${i + 1}`, value: r.headlineScore })),
    [rows],
  );

  function toggleFav(r: Row) {
    const next = toggleLocalFavourite(r._id);
    if (r.reportId) void setFavourite(r.reportId, next);
    setRows((rs) => rs.map((x) => (x._id === r._id ? { ...x, favourite: next } : x)));
  }
  async function remove(r: Row) {
    if (!confirm('Delete this saved result?')) return;
    removeLocalResult(r._id);
    if (uid) void deleteResult(r._id);
    setRows((rs) => rs.filter((x) => x._id !== r._id));
    setSelected((s) => s.filter((id) => id !== r._id));
  }
  function toggleSelect(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]));
  }
  function doCompare() {
    const a = rows.find((r) => r._id === selected[0]);
    const b = rows.find((r) => r._id === selected[1]);
    if (a && b) onCompare(a, b);
  }

  return (
    <div className="mx-auto max-w-4xl cx-fade-up" data-testid="nf-history-view">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold" style={{ color: 'var(--cx-text)' }}>My results</h1>
        <button onClick={onBack} className="cx-btn cx-btn-ghost cx-focus">← Back</button>
        <button onClick={onRetake} className="cx-btn cx-btn-primary cx-focus">＋ New assessment</button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <div className="cx-spin h-8 w-8 rounded-full" style={{ border: '3px solid var(--cx-track)', borderTopColor: 'var(--cx-gold)' }} />
        </div>
      ) : rows.length === 0 ? (
        <div className="cx-glass p-10 text-center">
          <div className="text-4xl">🗂️</div>
          <p className="mt-3 font-semibold" style={{ color: 'var(--cx-text)' }}>No saved results yet</p>
          <p className="cx-muted mt-1 text-sm">Complete an assessment and hit “Save result” to build your history.</p>
          <button onClick={onRetake} className="cx-btn cx-btn-primary mt-4">Start assessment</button>
        </div>
      ) : (
        <>
          {trend.length >= 2 ? (
            <div className="cx-glass mb-4 p-5">
              <p className="cx-muted mb-2 text-xs font-bold uppercase tracking-wide">Score trend</p>
              <TrendLine points={trend} />
            </div>
          ) : null}

          {/* Filters */}
          <div className="cx-glass mb-4 flex flex-wrap items-center gap-3 p-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search by niche…"
              aria-label="Search results by niche"
              className="cx-focus flex-1 rounded-xl border px-3 py-2 text-sm"
              style={{ minWidth: 160, background: 'var(--cx-surface)', borderColor: 'var(--cx-glass-border)', color: 'var(--cx-text)' }}
            />
            <label className="cx-muted flex items-center gap-2 text-xs font-semibold">
              Min score
              <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
              <span style={{ color: 'var(--cx-text)' }}>{minScore}</span>
            </label>
            <button onClick={() => setFavOnly((f) => !f)} className="cx-btn cx-btn-ghost cx-focus !min-h-0 !py-1.5 text-xs" aria-pressed={favOnly}>
              {favOnly ? '★ Favourites' : '☆ Favourites'}
            </button>
          </div>

          {selected.length === 2 ? (
            <div className="cx-glass mb-4 flex items-center justify-between p-4">
              <span className="text-sm font-semibold" style={{ color: 'var(--cx-text)' }}>2 results selected</span>
              <button onClick={doCompare} className="cx-btn cx-btn-gold cx-focus">⚖️ Compare</button>
            </div>
          ) : null}

          <div className="space-y-3">
            {filtered.map((r) => {
              const top = r.recommendations[0];
              const sel = selected.includes(r._id);
              const date = r.savedAt ? new Date(r.savedAt).toLocaleDateString() : '';
              return (
                <div key={r._id} data-testid="nf-history-row" className="cx-glass flex flex-wrap items-center gap-3 p-4" style={sel ? { boxShadow: '0 0 0 2px var(--cx-gold) inset' } : undefined}>
                  <input type="checkbox" checked={sel} onChange={() => toggleSelect(r._id)} aria-label={`Select ${top?.title} for comparison`} className="cx-focus h-4 w-4" />
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-extrabold" style={{ background: 'linear-gradient(120deg,var(--cx-brand),var(--cx-gold))', color: '#fff' }}>
                    {r.headlineScore}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold" style={{ color: 'var(--cx-text)' }}>{top?.title ?? '—'}</p>
                    <p className="cx-muted text-xs">{top?.categoryName} · {r.headlineConfidence}% confidence {date ? `· ${date}` : ''}</p>
                  </div>
                  <button onClick={() => toggleFav(r)} className="cx-focus text-lg" aria-label={r.favourite ? 'Unfavourite' : 'Favourite'} title="Favourite">
                    {r.favourite ? '★' : '☆'}
                  </button>
                  <button onClick={() => onOpen(r)} className="cx-btn cx-btn-ghost cx-focus !min-h-0 !py-1.5 text-xs">Open</button>
                  <button onClick={() => remove(r)} className="cx-focus text-xs font-semibold" style={{ color: '#d0602b' }}>Delete</button>
                </div>
              );
            })}
            {!filtered.length ? <p className="cx-muted py-8 text-center text-sm">No results match your filters.</p> : null}
          </div>
        </>
      )}
    </div>
  );
}

export { addLocalResult };
