'use client';

/**
 * Premium niche card — the atom of the discovery experience.
 *
 * Deliberately fixed-height: the discovery grid virtualizes on row arithmetic,
 * which only works if every card is the same height. That is also why the
 * action row is always rendered rather than revealed on hover — a card that
 * grows under the cursor moves the target the user is reaching for.
 *
 * The select toggle is the ONLY `aria-pressed` element in the card, so the
 * assessment's "pick an answer" semantics keep pointing at the real choice.
 */

import { highlightParts } from '@/lib/nicheAI/discovery';
import type { EnrichedTopic } from '@/lib/nicheAI/topicEngine';

/** Row height used by the virtualized grid. Keep in sync with the card. */
export const NICHE_CARD_HEIGHT = 200;

function Highlighted({ text, query }: { text: string; query: string }) {
  const parts = highlightParts(text, query);
  if (parts.length === 1 && !parts[0].hit) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} style={{ background: 'rgba(208,160,48,0.28)', color: 'inherit', borderRadius: 3, padding: '0 1px' }}>
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

const LEVEL_TONE: Record<string, string> = {
  Low: 'var(--cx-muted)',
  Medium: 'var(--cx-text)',
  High: 'var(--cx-brand-soft)',
  'Very High': 'var(--cx-gold)',
};

// Four metrics share one card width, so both the labels and the values are
// abbreviated — a truncated "Interme…" tells the user nothing, and an
// overflowing "COMPETITION" collides with the column beside it.
const SHORT_SKILL: Record<string, string> = { Beginner: 'Beginner', Intermediate: 'Inter.', Advanced: 'Adv.' };
const SHORT_LEVEL: Record<string, string> = { Low: 'Low', Medium: 'Medium', High: 'High', 'Very High': 'V. High' };

function Metric({ label, value, title, tone }: { label: string; value: string; title?: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="cx-muted truncate text-[9px] font-bold uppercase tracking-wide">{label}</div>
      <div className="truncate text-[11px] font-bold" style={{ color: tone ?? 'var(--cx-text)' }} title={title}>
        {value}
      </div>
    </div>
  );
}

export function NicheCard({
  topic,
  selected,
  favourite,
  query = '',
  matchScore,
  onToggle,
  onDetails,
  onFavourite,
}: {
  topic: EnrichedTopic;
  selected: boolean;
  favourite?: boolean;
  /** Current search query — highlights matching runs in the name and blurb. */
  query?: string;
  /** 0–100 affinity against the user's current picks, when one is known. */
  matchScore?: number;
  onToggle: (id: string) => void;
  onDetails: (t: EnrichedTopic) => void;
  onFavourite?: (id: string) => void;
}) {
  return (
    <article
      className="cx-glass flex flex-col p-4"
      style={{ height: NICHE_CARD_HEIGHT }}
      data-testid="nf-niche-card"
      data-topic-id={topic.id}
    >
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-sm font-extrabold leading-snug" style={{ color: 'var(--cx-text)' }}>
          <Highlighted text={topic.label} query={query} />
        </h3>
        {typeof matchScore === 'number' ? (
          <span
            className="cx-chip shrink-0 !py-0.5 !text-[10px] font-bold"
            title="How well this fits the topics you have already picked"
            style={{ background: 'rgba(208,160,48,0.16)', color: 'var(--cx-gold)' }}
          >
            {matchScore}% match
          </span>
        ) : null}
        {onFavourite ? (
          <button
            type="button"
            onClick={() => onFavourite(topic.id)}
            className="cx-focus shrink-0 rounded-full px-1 text-sm leading-none"
            aria-label={favourite ? `Remove ${topic.label} from favourites` : `Add ${topic.label} to favourites`}
            style={{ color: favourite ? 'var(--cx-gold)' : 'var(--cx-muted)' }}
          >
            {favourite ? '★' : '☆'}
          </button>
        ) : null}
      </div>

      <p className="cx-muted mt-1.5 line-clamp-3 text-[11px] leading-relaxed">
        <Highlighted text={topic.description} query={query} />
      </p>

      <div className="mt-auto grid grid-cols-4 gap-1.5 pt-3">
        <Metric label="Level" value={SHORT_SKILL[topic.skillLevel] ?? topic.skillLevel} title={topic.skillLevel} />
        <Metric
          label="Demand"
          value={SHORT_LEVEL[topic.marketDemand] ?? topic.marketDemand}
          title={`Market demand: ${topic.marketDemand}`}
          tone={LEVEL_TONE[topic.marketDemand]}
        />
        <Metric
          label="Comp."
          value={SHORT_LEVEL[topic.competitionLevel] ?? topic.competitionLevel}
          title={`Competition: ${topic.competitionLevel}`}
          tone={LEVEL_TONE[topic.competitionLevel]}
        />
        <Metric
          label="Growth"
          value={String(topic.opportunityScore)}
          title={`Growth potential: ${topic.opportunityScore}/100`}
          tone="var(--cx-brand-soft)"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(topic.id)}
          aria-pressed={selected}
          data-testid="nf-topic-select"
          data-state={selected ? 'done' : undefined}
          className="cx-btn cx-focus btn-fx-success !min-h-0 flex-1 !px-3 !py-1.5 !text-[11px]"
          style={{
            background: selected ? 'var(--cx-track)' : 'linear-gradient(100deg, var(--cx-brand), var(--cx-gold))',
            color: selected ? 'var(--cx-text)' : '#fff',
          }}
        >
          <span className="btn-ico" aria-hidden="true">{selected ? '✓' : '+'}</span>
          <span className="btn-label">{selected ? 'Selected' : 'Add'}</span>
        </button>
        <button
          type="button"
          onClick={() => onDetails(topic)}
          data-testid="nf-niche-details"
          className="cx-btn cx-btn-ghost cx-focus btn-fx-card !min-h-0 !px-3 !py-1.5 !text-[11px]"
          aria-label={`View details for ${topic.label}`}
        >
          <span className="btn-label">Details</span>
        </button>
      </div>
    </article>
  );
}
