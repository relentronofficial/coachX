'use client';

/**
 * Topic details drawer — the full 21-field profile for one topic, plus its
 * related and similar topics. Slides in from the right, traps focus, and closes
 * on Escape or backdrop click.
 */

import { useEffect, useRef } from 'react';
import { similarTopics, type EnrichedTopic } from '@/lib/nicheAI/topicEngine';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b py-1.5 text-xs last:border-0" style={{ borderColor: 'var(--cx-glass-border)' }}>
      <span className="cx-muted w-36 shrink-0 font-semibold">{label}</span>
      <span className="min-w-0 flex-1" style={{ color: 'var(--cx-text)' }}>{value}</span>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((i) => <span key={i} className="cx-chip !py-0.5 !text-[10px]">{i}</span>)}
    </span>
  );
}

export function TopicDrawer({
  topic, selected, onToggle, onClose, onOpenTopic, lookup,
}: {
  topic: EnrichedTopic;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
  onOpenTopic: (t: EnrichedTopic) => void;
  lookup: (id: string) => EnrichedTopic | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isOn = selected.has(topic.id);
  const related = topic.related.map(lookup).filter(Boolean).slice(0, 8) as EnrichedTopic[];
  const similar = similarTopics(topic.id, 6).filter((s) => !topic.related.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="nf-topic-drawer">
      <button className="absolute inset-0 bg-black/40" aria-label="Close details" onClick={onClose} tabIndex={-1} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`${topic.label} details`}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto p-4 shadow-2xl"
        style={{ background: 'var(--cx-surface-solid)', borderLeft: '1px solid var(--cx-glass-border)' }}
      >
        <div className="mb-3 flex items-start gap-2">
          <div className="min-w-0">
            <p className="cx-muted text-[10px] font-bold uppercase tracking-wide">
              {topic.group} › {topic.parentCategory} › {topic.subcategory}
            </p>
            <h3 className="text-lg font-extrabold" style={{ color: 'var(--cx-text)' }}>{topic.label}</h3>
          </div>
          <button ref={closeRef} onClick={onClose} aria-label="Close" className="cx-focus ml-auto rounded-full px-2 py-1 text-lg font-bold" style={{ color: 'var(--cx-muted)' }}>×</button>
        </div>

        <p className="mb-3 text-sm" style={{ color: 'var(--cx-text)' }}>{topic.description}</p>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => onToggle(topic.id)}
            data-testid="nf-drawer-select"
            data-state={isOn ? 'done' : undefined}
            className="cx-btn cx-focus btn-fx-success !py-1.5 text-xs font-bold"
            style={{
              background: isOn ? 'var(--cx-track)' : 'linear-gradient(100deg, var(--cx-brand), var(--cx-gold))',
              color: isOn ? 'var(--cx-text)' : '#fff',
            }}
          >
            <span className="btn-ico" aria-hidden="true">{isOn ? '✓' : '+'}</span>
            <span className="btn-label">{isOn ? 'Selected — remove' : 'Add to my topics'}</span>
          </button>
          <span className="cx-chip !py-1 !text-[11px]">Opportunity {topic.opportunityScore}/100</span>
        </div>

        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--cx-muted)' }}>Profile</div>
        <div className="mb-3">
          <Row label="Coaching type" value={topic.coachingType} />
          <Row label="Industry" value={topic.industry} />
          <Row label="Business model" value={topic.businessCategory} />
          <Row label="Skill level" value={topic.skillLevel} />
          <Row label="Experience level" value={topic.experienceLevel} />
          <Row label="Audience" value={<Chips items={topic.audience} />} />
          <Row label="Revenue potential" value={`${topic.revenuePotential} · ${topic.revenueBand}`} />
          <Row label="Market demand" value={topic.marketDemand} />
          <Row label="Competition" value={topic.competitionLevel} />
        </div>

        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--cx-muted)' }}>How you could monetise it</div>
        <div className="mb-3">
          <Row label="Content formats" value={<Chips items={topic.contentFormats} />} />
          <Row label="Offer types" value={<Chips items={topic.offerTypes} />} />
          <Row label="Digital products" value={<Chips items={topic.digitalProducts} />} />
          <Row label="Services" value={<Chips items={topic.services} />} />
          <Row label="Community" value={<Chips items={topic.communityFormats} />} />
          <Row label="Certifications" value={<Chips items={topic.certifications} />} />
        </div>

        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--cx-muted)' }}>Discovery</div>
        <div className="mb-3">
          <Row label="AI tags" value={<Chips items={topic.aiTags} />} />
          <Row label="Search keywords" value={<Chips items={topic.keywords.slice(0, 12)} />} />
        </div>

        {related.length ? (
          <>
            <p className="cx-muted mb-1 text-[10px] font-bold uppercase tracking-wide">Related topics</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {related.map((r) => (
                <button key={r.id} onClick={() => onOpenTopic(r)} className="cx-chip cx-focus !text-[11px]">{r.label}</button>
              ))}
            </div>
          </>
        ) : null}

        {similar.length ? (
          <>
            <p className="cx-muted mb-1 text-[10px] font-bold uppercase tracking-wide">Similar — avoid picking near-duplicates</p>
            <div className="flex flex-wrap gap-1.5">
              {similar.map((s) => (
                <button key={s.id} onClick={() => onOpenTopic(s)} className="cx-chip cx-focus !text-[11px]">
                  {selected.has(s.id) ? '✓ ' : ''}{s.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
