'use client';

/**
 * Editorial workflow for topics: the draft → pending → published approval
 * queue, archive/restore (soft delete), version history with rollback, and
 * duplicate detection with merge.
 *
 * Everything here operates on the Firestore *overlay*; the code library is the
 * immutable base. Archiving therefore hides a topic rather than destroying it,
 * and merging keeps the loser with a `mergedInto` pointer so historical
 * selections stay resolvable.
 */

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { ALL_TOPICS, type EnrichedTopic } from '@/lib/nicheAI/topicEngine';
import {
  archiveTopic, listTopicVersions, mergeTopics, restoreTopic, restoreTopicVersion, setTopicStatus,
  type TopicDoc, type TopicStatus, type TopicVersionDoc,
} from '@/lib/nicheAI/topicStore';

const STATUS_STYLE: Record<TopicStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber/15 text-amber-dark',
  published: 'bg-teal/15 text-teal',
  archived: 'bg-red-100 text-red-600',
};

function StatusPill({ status }: { status: TopicStatus }) {
  return <span className={`rounded-pill px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[status]}`}>{status}</span>;
}

export function TopicWorkflow({
  docs, actorEmail, canManage, canApprove, onChanged, onError,
}: {
  docs: TopicDoc[];
  actorEmail: string;
  canManage: boolean;
  canApprove: boolean;
  onChanged: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  const [pane, setPane] = useState<'queue' | 'archived' | 'duplicates'>('queue');
  const [versionsFor, setVersionsFor] = useState<TopicDoc | null>(null);
  const [versions, setVersions] = useState<TopicVersionDoc[]>([]);
  const [mergeFrom, setMergeFrom] = useState<TopicDoc | null>(null);

  const statusOf = (d: TopicDoc): TopicStatus => d.status ?? (d.enabled === false ? 'archived' : 'published');

  const queue = useMemo(() => docs.filter((d) => ['draft', 'pending'].includes(statusOf(d))), [docs]);
  const archived = useMemo(() => docs.filter((d) => statusOf(d) === 'archived'), [docs]);

  /**
   * Duplicate detection across the whole library: exact label collisions and
   * near-identical labels inside the same category. Normalising away casing,
   * punctuation and the modifier suffixes ("… for beginners") is what surfaces
   * genuine duplicates rather than legitimate long-tail variants.
   */
  const duplicates = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const groups = new Map<string, EnrichedTopic[]>();
    for (const t of ALL_TOPICS) {
      const key = norm(t.label);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return [...groups.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([key, list]) => ({ key, list }))
      .sort((a, b) => b.list.length - a.list.length)
      .slice(0, 60);
  }, []);

  async function act(fn: () => Promise<void>, failMsg: string) {
    try { await fn(); await onChanged(); } catch { onError(failMsg); }
  }

  async function openVersions(d: TopicDoc) {
    setVersionsFor(d);
    setVersions(await listTopicVersions(d.id));
  }

  const asDoc = (t: EnrichedTopic): TopicDoc => ({
    id: t.id, label: t.label, group: t.group, parentCategory: t.parentCategory, categoryId: t.categoryId,
    subcategory: t.subcategory, niche: t.niche, businessCategory: t.businessCategory, difficulty: t.difficulty,
    monetization: t.monetization, audience: t.audience, keywords: t.keywords, custom: false, enabled: true,
    industry: t.industry, description: t.description, status: 'published',
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1 rounded-pill bg-slate-100 p-1 text-xs font-semibold">
        {([['queue', `Approval queue (${queue.length})`], ['archived', `Archived (${archived.length})`], ['duplicates', `Duplicates (${duplicates.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setPane(k)} className={`rounded-pill px-3 py-1.5 ${pane === k ? 'bg-white text-ink shadow-soft' : 'text-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {!canApprove ? (
        <p className="mb-3 rounded-card border border-amber/40 bg-amber/10 p-2 text-xs text-amber-dark">
          You can review this queue but not approve — publishing requires the <code>settings.manage</code> permission.
        </p>
      ) : null}

      {pane === 'queue' ? (
        queue.length ? (
          <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
            <table className="w-full min-w-[680px] text-sm" data-testid="admin-approval-queue">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="p-3">Topic</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Submitted by</th><th className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {queue.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="p-3 font-medium text-ink">{d.label}</td>
                    <td className="p-3 text-xs text-slate-500">{d.parentCategory} › {d.subcategory}</td>
                    <td className="p-3"><StatusPill status={statusOf(d)} /></td>
                    <td className="p-3 text-xs text-slate-500">{d.submittedBy ?? '—'}</td>
                    <td className="p-3 text-xs">
                      <button onClick={() => act(() => setTopicStatus(d, 'published', actorEmail), 'Requires Firebase.')} disabled={!canApprove} className="font-semibold text-teal hover:underline disabled:opacity-40">Approve</button>
                      <button onClick={() => act(() => setTopicStatus(d, 'draft', actorEmail), 'Requires Firebase.')} disabled={!canApprove} className="ml-2 text-slate-500 hover:underline disabled:opacity-40">Send back</button>
                      <button onClick={() => act(() => archiveTopic(d, actorEmail), 'Requires Firebase.')} disabled={!canManage} className="ml-2 text-red-500 hover:underline disabled:opacity-40">Reject</button>
                      <button onClick={() => openVersions(d)} className="ml-2 text-slate-400 hover:underline">History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-card border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            Nothing awaiting approval. Topics created as drafts appear here for review before they reach the explorer.
          </p>
        )
      ) : null}

      {pane === 'archived' ? (
        archived.length ? (
          <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
            <table className="w-full min-w-[620px] text-sm" data-testid="admin-archived">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="p-3">Topic</th><th className="p-3">Category</th><th className="p-3">Merged into</th><th className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {archived.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 last:border-0">
                    <td className="p-3 font-medium text-ink">{d.label}</td>
                    <td className="p-3 text-xs text-slate-500">{d.parentCategory} › {d.subcategory}</td>
                    <td className="p-3 text-xs text-slate-500">{d.mergedInto ?? '—'}</td>
                    <td className="p-3 text-xs">
                      <button onClick={() => act(() => restoreTopic(d, actorEmail), 'Requires Firebase.')} disabled={!canManage} className="font-semibold text-teal hover:underline disabled:opacity-40">Restore</button>
                      <button onClick={() => openVersions(d)} className="ml-2 text-slate-400 hover:underline">History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-card border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            No archived topics. Deleting a topic archives it here rather than destroying it, so it can always be restored.
          </p>
        )
      ) : null}

      {pane === 'duplicates' ? (
        <div>
          <p className="mb-2 text-xs text-slate-500">
            Labels that appear in more than one place. Some are legitimate (the same skill taught to different audiences);
            merge only where they are genuinely the same topic.
          </p>
          <div className="space-y-2">
            {duplicates.map(({ key, list }) => (
              <div key={key} className="rounded-card border border-slate-200 bg-white p-3" data-testid="admin-duplicate-group">
                <p className="mb-1 text-sm font-semibold text-ink">{list[0].label} <span className="text-xs font-normal text-slate-400">×{list.length}</span></p>
                <div className="space-y-1">
                  {list.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="truncate">{t.group} › {t.parentCategory} › {t.subcategory}</span>
                      <button
                        onClick={() => setMergeFrom(asDoc(t))}
                        disabled={!canManage}
                        className="ml-auto font-semibold text-teal hover:underline disabled:opacity-40"
                      >
                        Merge away
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!duplicates.length ? <p className="rounded-card border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">No duplicate labels detected.</p> : null}
          </div>
        </div>
      ) : null}

      {versionsFor ? (
        <Modal open onClose={() => setVersionsFor(null)} title={<span>Version history — {versionsFor.label}</span>}>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {versions.length ? versions.map((v) => (
              <div key={v.id} className="flex items-center gap-2 rounded-card border border-slate-200 p-2 text-xs">
                <span className="font-semibold text-ink">v{v.version}</span>
                <span className="text-slate-500">{v.snapshot.label}</span>
                <span className="ml-auto text-slate-400">{v.actor}</span>
                <button
                  onClick={async () => { await act(() => restoreTopicVersion(v, actorEmail), 'Requires Firebase.'); setVersionsFor(null); }}
                  disabled={!canManage}
                  className="font-semibold text-teal hover:underline disabled:opacity-40"
                >
                  Restore
                </button>
              </div>
            )) : (
              <p className="text-sm text-slate-400">
                No stored versions yet. A snapshot is written each time this topic is edited, approved or archived.
              </p>
            )}
          </div>
        </Modal>
      ) : null}

      {mergeFrom ? (
        <MergePicker
          from={mergeFrom}
          onCancel={() => setMergeFrom(null)}
          onMerge={async (into) => {
            await act(() => mergeTopics(mergeFrom, into, actorEmail), 'Requires Firebase.');
            setMergeFrom(null);
          }}
        />
      ) : null}
    </div>
  );
}

function MergePicker({ from, onCancel, onMerge }: { from: TopicDoc; onCancel: () => void; onMerge: (into: TopicDoc) => void }) {
  const [q, setQ] = useState(from.label);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return ALL_TOPICS.filter((t) => t.id !== from.id && t.label.toLowerCase().includes(s)).slice(0, 20);
  }, [q, from.id]);

  return (
    <Modal open onClose={onCancel} title={<span>Merge “{from.label}” into…</span>}>
      <p className="mt-2 text-xs text-slate-500">
        The chosen topic survives and absorbs the keywords. “{from.label}” is archived with a pointer to it, so existing
        selections still resolve.
      </p>
      <input value={q} onChange={(e) => setQ(e.target.value)} className="cx-admin-input mt-3" placeholder="Search for the surviving topic…" autoFocus />
      <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
        {results.map((t) => (
          <button
            key={t.id}
            onClick={() => onMerge({
              id: t.id, label: t.label, group: t.group, parentCategory: t.parentCategory, categoryId: t.categoryId,
              subcategory: t.subcategory, niche: t.niche, businessCategory: t.businessCategory, difficulty: t.difficulty,
              monetization: t.monetization, audience: t.audience, keywords: t.keywords, custom: false, enabled: true,
              status: 'published',
            })}
            className="block w-full rounded-card border border-slate-200 p-2 text-left text-xs hover:border-teal"
          >
            <span className="font-semibold text-ink">{t.label}</span>
            <span className="block text-slate-400">{t.parentCategory} › {t.subcategory}</span>
          </button>
        ))}
        {!results.length ? <p className="p-2 text-xs text-slate-400">No matches.</p> : null}
      </div>
      <div className="mt-4 flex justify-end"><button onClick={onCancel} className="btn-secondary">Cancel</button></div>
    </Modal>
  );
}
