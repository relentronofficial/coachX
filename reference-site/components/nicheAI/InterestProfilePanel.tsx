'use client';

/**
 * Interest profile — the AI read on a user's topic selection, shown before they
 * advance. Surfaces confidence, the shape of their interests, overlapping picks
 * to prune, and complementary topics that would round the selection out.
 */

import type { EnrichedTopic, InterestProfile } from '@/lib/nicheAI/topicEngine';

function Meter({ value, label, hint }: { value: number; label: string; hint?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[11px] font-bold" style={{ color: 'var(--cx-text)' }}>{label}</span>
        <span className="cx-muted text-[10px]">{hint ?? `${value}%`}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--cx-track)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: 'linear-gradient(90deg,var(--cx-brand),var(--cx-gold))' }} />
      </div>
    </div>
  );
}

export function InterestProfilePanel({
  profile, onToggle, onDrop,
}: {
  profile: InterestProfile;
  onToggle: (id: string) => void;
  onDrop?: (t: EnrichedTopic) => void;
  }) {
  if (!profile.count) return null;

  return (
    <div className="cx-glass mt-3 p-4" data-testid="nf-interest-profile">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-extrabold" style={{ color: 'var(--cx-text)' }}>🧠 Your interest profile</h4>
        <span
          className="cx-chip !py-0.5 !text-[10px]"
          data-testid="nf-confidence"
          title="Blends how many topics you picked with how coherent they are"
        >
          Confidence: {profile.confidenceLabel} ({profile.confidence}%)
        </span>
        <span className="cx-muted ml-auto text-[10px]">{profile.count} topics · {profile.breadth} categories</span>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <Meter value={profile.confidence} label="Signal strength" />
        <Meter value={profile.focus} label="Focus" hint={`${profile.focus}% in top niche`} />
        <Meter value={profile.avgOpportunity} label="Avg opportunity" hint={`${profile.avgOpportunity}/100`} />
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="cx-muted mb-1 text-[10px] font-bold uppercase tracking-wide">Leaning towards</p>
          <div className="space-y-1">
            {profile.topNiches.map((n) => (
              <div key={n.niche} className="flex items-center gap-2">
                <span className="w-32 shrink-0 truncate text-[11px] font-semibold" style={{ color: 'var(--cx-text)' }}>{n.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--cx-track)' }}>
                  <div className="h-full rounded-full" style={{ width: `${n.share}%`, background: 'var(--cx-brand)' }} />
                </div>
                <span className="cx-muted w-8 shrink-0 text-right text-[10px]">{n.share}%</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="cx-muted mb-1 text-[10px] font-bold uppercase tracking-wide">Audiences & industries</p>
          <div className="flex flex-wrap gap-1">
            {profile.audiences.map((a) => <span key={a.name} className="cx-chip !py-0.5 !text-[10px]">{a.name} ×{a.count}</span>)}
            {profile.topIndustries.slice(0, 3).map((i) => <span key={i.name} className="cx-chip !py-0.5 !text-[10px]">{i.name}</span>)}
          </div>
          <p className="cx-muted mt-2 text-[10px]">
            Skill mix — {profile.skillMix.Beginner} beginner · {profile.skillMix.Intermediate} intermediate · {profile.skillMix.Advanced} advanced
          </p>
        </div>
      </div>

      {profile.overlaps.length ? (
        <div className="mb-3" data-testid="nf-overlaps">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--cx-gold)' }}>Overlapping picks</p>
          <div className="space-y-1">
            {profile.overlaps.map(({ a, b }) => (
              <p key={`${a.id}-${b.id}`} className="text-[11px]" style={{ color: 'var(--cx-text)' }}>
                “{a.label}” and “{b.label}” cover similar ground —{' '}
                <button onClick={() => onToggle(b.id)} className="cx-focus font-semibold underline" style={{ color: 'var(--cx-brand)' }}>
                  drop the second
                </button>
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {profile.gaps.length ? (
        <div className="mb-3">
          <p className="cx-muted mb-1 text-[10px] font-bold uppercase tracking-wide">To sharpen your result</p>
          <ul className="list-inside list-disc space-y-0.5">
            {profile.gaps.map((g) => <li key={g} className="text-[11px]" style={{ color: 'var(--cx-text)' }}>{g}</li>)}
          </ul>
        </div>
      ) : null}

      {profile.complementary.length ? (
        <div>
          <p className="cx-muted mb-1 text-[10px] font-bold uppercase tracking-wide">Missing complements — often paired with your picks</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.complementary.map((t) => (
              <button
                key={t.id}
                onClick={() => onToggle(t.id)}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); onDrop?.(t); }}
                className="cx-focus rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ border: '1px dashed var(--cx-brand)', background: 'var(--cx-surface)', color: 'var(--cx-text)' }}
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
