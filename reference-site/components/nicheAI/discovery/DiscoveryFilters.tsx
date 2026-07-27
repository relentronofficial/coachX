'use client';

/**
 * Filter bar for the niche lists.
 *
 * Every filter here is backed by a real field on `EnrichedTopic` — industry,
 * experience level, income potential, market demand and competition. Filters
 * without data behind them (online/offline, investment required, language,
 * location) are deliberately absent rather than faked across 10,183 topics.
 *
 * Collapsible by default on mobile, where a permanently open filter bar pushes
 * the actual results below the fold.
 */

import { useId, useState } from 'react';
import {
  DIFFICULTIES,
  MONETIZATIONS,
  type EnrichedTopic,
} from '@/lib/nicheAI/topicEngine';

export interface DiscoveryFilterState {
  industry: string;
  experience: string;
  income: string;
  demand: string;
  competition: string;
}

export const EMPTY_FILTERS: DiscoveryFilterState = {
  industry: '',
  experience: '',
  income: '',
  demand: '',
  competition: '',
};

const LEVELS = ['Low', 'Medium', 'High', 'Very High'];
const EXPERIENCE = ['Entry (0–1 yrs)', 'Working (1–3 yrs)', 'Experienced (3–7 yrs)', 'Expert (7+ yrs)'];

export function countActiveFilters(f: DiscoveryFilterState): number {
  return Object.values(f).filter(Boolean).length;
}

/** Pure predicate — exported so the filtering logic stays testable. */
export function matchesFilters(t: EnrichedTopic, f: DiscoveryFilterState): boolean {
  if (f.industry && t.industry !== f.industry) return false;
  if (f.experience && t.experienceLevel !== f.experience) return false;
  if (f.income && t.revenuePotential !== f.income) return false;
  if (f.demand && t.marketDemand !== f.demand) return false;
  if (f.competition && t.competitionLevel !== f.competition) return false;
  return true;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="cx-muted mb-1 block text-[10px] font-bold uppercase tracking-wide">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cx-focus w-full rounded-xl px-2.5 py-2 text-xs font-semibold"
        style={{
          background: 'var(--cx-surface-solid)',
          border: '1px solid var(--cx-glass-border)',
          color: 'var(--cx-text)',
          minHeight: 40,
        }}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DiscoveryFilters({
  value,
  onChange,
  industries,
  resultCount,
}: {
  value: DiscoveryFilterState;
  onChange: (v: DiscoveryFilterState) => void;
  industries: string[];
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = countActiveFilters(value);
  const set = (patch: Partial<DiscoveryFilterState>) => onChange({ ...value, ...patch });

  return (
    <div data-testid="nf-filters">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          data-testid="nf-filters-toggle"
          className="cx-chip cx-focus !px-3.5 !py-2 !text-xs"
          style={active ? { background: 'var(--cx-brand)', color: '#fff' } : undefined}
        >
          <span aria-hidden="true">⚙</span> Filters{active ? ` · ${active}` : ''}
        </button>
        <span className="cx-muted text-[11px] font-semibold" aria-live="polite" data-testid="nf-result-count">
          {resultCount.toLocaleString()} {resultCount === 1 ? 'niche' : 'niches'}
        </span>
        {active ? (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="cx-focus text-[11px] font-bold underline"
            style={{ color: 'var(--cx-gold)' }}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={panelId}
          className="cx-glass mt-2 grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-5"
          data-testid="nf-filters-panel"
        >
          <Select label="Industry" value={value.industry} options={industries} onChange={(v) => set({ industry: v })} />
          <Select label="Experience" value={value.experience} options={EXPERIENCE} onChange={(v) => set({ experience: v })} />
          <Select label="Income potential" value={value.income} options={MONETIZATIONS as unknown as string[]} onChange={(v) => set({ income: v })} />
          <Select label="Demand" value={value.demand} options={LEVELS} onChange={(v) => set({ demand: v })} />
          <Select label="Competition" value={value.competition} options={LEVELS} onChange={(v) => set({ competition: v })} />
        </div>
      ) : null}
    </div>
  );
}

/** Re-exported so callers do not need a second import for the skill levels. */
export { DIFFICULTIES };
