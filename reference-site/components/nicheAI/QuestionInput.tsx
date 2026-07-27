'use client';

/**
 * Renders any supported question type with full keyboard + a11y support:
 * single, multi, multiSelect, scale, ranking, text, tags.
 */

import { useMemo, useState } from 'react';
import type { AnswerValue, Question } from '@/lib/nicheAI/types';
import { asArray } from '@/lib/nicheAI/engine';
import { NicheDiscovery } from './discovery/NicheDiscovery';

export function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  switch (question.type) {
    case 'single':
      return <SingleChoice q={question} value={typeof value === 'string' ? value : ''} onChange={onChange} />;
    case 'multi':
      return <MultiChoice q={question} value={asArray(value)} onChange={onChange} />;
    case 'multiSelect':
      return <MultiSelect q={question} value={asArray(value)} onChange={onChange} />;
    case 'scale':
      return <Scale q={question} value={typeof value === 'number' ? value : undefined} onChange={onChange} />;
    case 'ranking':
      return <Ranking q={question} value={asArray(value)} onChange={onChange} />;
    case 'tags':
      return <Tags q={question} value={asArray(value)} onChange={onChange} />;
    case 'text':
      return <TextInput q={question} value={typeof value === 'string' ? value : ''} onChange={onChange} />;
    default:
      return null;
  }
}

function Check({ active, kind }: { active: boolean; kind: 'radio' | 'check' }) {
  return (
    <span
      aria-hidden
      className={`ml-auto grid h-5 w-5 shrink-0 place-items-center border text-[11px] ${kind === 'radio' ? 'rounded-full' : 'rounded-md'}`}
      style={{
        borderColor: active ? 'var(--cx-brand)' : 'var(--cx-glass-border)',
        background: active ? 'var(--cx-brand)' : 'transparent',
        color: active ? '#fff' : 'transparent',
      }}
    >
      ✓
    </span>
  );
}

function SingleChoice({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={q.title} className="grid gap-3 sm:grid-cols-2">
      {q.options?.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className="cx-option cx-focus"
          >
            {o.icon ? <span className="text-xl">{o.icon}</span> : null}
            <span>
              <span className="block text-sm font-bold">{o.label}</span>
              {o.hint ? <span className="cx-muted mt-0.5 block text-xs">{o.hint}</span> : null}
            </span>
            <Check active={active} kind="radio" />
          </button>
        );
      })}
    </div>
  );
}

function MultiChoice({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: string[]) => void }) {
  // Large topic set → the progressive discovery experience (rails → categories →
  // subcategories → niche cards → details), never a flat grid of thousands.
  if (q.options && q.options.length > 500) return <NicheDiscovery mode="select" value={value} onChange={onChange} min={q.min} />;
  // Smaller grouped options → the compact searchable, category picker.
  if (q.options?.some((o) => o.group)) return <GroupedPicker q={q} value={value} onChange={onChange} />;

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {q.options?.map((o) => {
        const active = value.includes(o.value);
        return (
          <button key={o.value} type="button" aria-pressed={active} onClick={() => toggle(o.value)} className="cx-option cx-focus">
            {o.icon ? <span className="text-xl">{o.icon}</span> : null}
            <span>
              <span className="block text-sm font-bold">{o.label}</span>
              {o.hint ? <span className="cx-muted mt-0.5 block text-xs">{o.hint}</span> : null}
            </span>
            <Check active={active} kind="check" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Clean, searchable, category-grouped multi-select for large topic sets
 * (250+ options). Selected chips up top, live search, and collapsible category
 * sections — same multi-select behaviour, just built to browse at scale.
 */
function GroupedPicker({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: string[]) => void }) {
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const options = q.options ?? [];
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const groups = useMemo(() => {
    const map = new Map<string, typeof options>();
    for (const o of options) {
      const g = o.group ?? 'Topics';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(o);
    }
    return [...map.entries()];
  }, [options]);

  const filter = search.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      groups
        .map(([g, opts]) => [g, filter ? opts.filter((o) => o.label.toLowerCase().includes(filter)) : opts] as const)
        .filter(([, opts]) => opts.length),
    [groups, filter],
  );

  // While searching every group is open; otherwise the first category is open
  // by default so topics are immediately visible, the rest expand on click.
  const isOpen = (g: string, idx: number) => !!filter || (openGroups[g] ?? idx === 0);

  return (
    <div>
      {/* Selected chips */}
      {value.length ? (
        <div className="mb-3 flex flex-wrap gap-2" aria-label="Selected topics">
          {value.map((v) => {
            const o = byValue.get(v);
            return (
              <button key={v} type="button" onClick={() => toggle(v)} className="cx-chip cx-focus" aria-label={`Remove ${o?.label ?? v}`}>
                {o?.label ?? v} <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search topics… (e.g. AI, fitness, real estate)"
        aria-label="Search topics"
        className="cx-focus mb-3 w-full rounded-xl border px-4 py-2.5 text-sm"
        style={{ background: 'var(--cx-surface)', borderColor: 'var(--cx-glass-border)', color: 'var(--cx-text)' }}
      />

      {/* Grouped, browsable topic list */}
      <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
        {visibleGroups.map(([g, opts], idx) => {
          const selectedIn = opts.filter((o) => value.includes(o.value)).length;
          const open = isOpen(g, idx);
          return (
            <div key={g} className="rounded-xl" style={{ border: '1px solid var(--cx-glass-border)' }}>
              <button
                type="button"
                onClick={() => setOpenGroups((s) => ({ ...s, [g]: !(s[g] ?? idx === 0) }))}
                aria-expanded={open}
                className="cx-focus flex w-full items-center justify-between px-3 py-2.5 text-left"
              >
                <span className="text-sm font-bold" style={{ color: 'var(--cx-text)' }}>
                  {g}
                  {selectedIn ? <span className="cx-chip ml-2 !py-0.5 !text-[10px]">{selectedIn} selected</span> : null}
                </span>
                <span className="cx-muted text-xs">{filter ? `${opts.length} match` : open ? '▲' : `${opts.length} ▾`}</span>
              </button>
              {open ? (
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                  {opts.map((o) => {
                    const active = value.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggle(o.value)}
                        className="cx-focus rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          border: '1px solid var(--cx-glass-border)',
                          background: active ? 'linear-gradient(100deg, var(--cx-brand), var(--cx-gold))' : 'var(--cx-surface)',
                          color: active ? '#fff' : 'var(--cx-text)',
                        }}
                      >
                        {active ? '✓ ' : ''}
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
        {!visibleGroups.length ? <p className="cx-muted py-6 text-center text-sm">No topics match “{search}”. Try another word.</p> : null}
      </div>

      <p className="cx-muted mt-2 text-xs">
        {value.length} selected · {options.length} topics across {groups.length} categories
      </p>
    </div>
  );
}

function MultiSelect({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: string[]) => void }) {
  const [search, setSearch] = useState('');
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const filtered = useMemo(
    () => (q.options ?? []).filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [q.options, search],
  );
  return (
    <div>
      {value.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((v) => {
            const o = q.options?.find((x) => x.value === v);
            return (
              <button key={v} type="button" onClick={() => toggle(v)} className="cx-chip cx-focus" aria-label={`Remove ${o?.label ?? v}`}>
                {o?.label ?? v} <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search and select…"
        aria-label={`Search options for ${q.title}`}
        className="cx-focus mb-3 w-full rounded-xl border px-4 py-2.5 text-sm"
        style={{ background: 'var(--cx-surface)', borderColor: 'var(--cx-glass-border)', color: 'var(--cx-text)' }}
      />
      <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
        {filtered.map((o) => {
          const active = value.includes(o.value);
          return (
            <button key={o.value} type="button" aria-pressed={active} onClick={() => toggle(o.value)} className="cx-option cx-focus !py-2.5">
              <span className="text-sm font-semibold">{o.label}</span>
              <Check active={active} kind="check" />
            </button>
          );
        })}
        {!filtered.length ? <p className="cx-muted col-span-full py-3 text-center text-sm">No matches.</p> : null}
      </div>
    </div>
  );
}

function Scale({ q, value, onChange }: { q: Question; value: number | undefined; onChange: (v: number) => void }) {
  const { min, max, minLabel, maxLabel } = q.scale ?? { min: 1, max: 5, minLabel: '', maxLabel: '' };
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={q.title}
        className="flex gap-2"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, (value ?? min) + 1));
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, (value ?? min) - 1));
        }}
      >
        {items.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active || (value === undefined && n === min) ? 0 : -1}
              onClick={() => onChange(n)}
              className="cx-option cx-focus grow justify-center !py-4 text-lg font-extrabold"
              data-active={active}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="cx-muted mt-2 flex justify-between text-xs font-semibold">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function Ranking({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: string[]) => void }) {
  const order = value.length ? value : (q.options ?? []).map((o) => o.value);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ol className="space-y-2">
      {order.map((val, i) => {
        const o = q.options?.find((x) => x.value === val);
        return (
          <li key={val} className="cx-option !cursor-default items-center">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-extrabold" style={{ background: 'var(--cx-brand)', color: '#fff' }}>
              {i + 1}
            </span>
            <span className="text-sm font-semibold">{o?.label ?? val}</span>
            <span className="ml-auto flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${o?.label ?? val} up`} className="cx-btn cx-btn-ghost cx-focus !min-h-0 !px-2 !py-1 disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${o?.label ?? val} down`} className="cx-btn cx-btn-ghost cx-focus !min-h-0 !px-2 !py-1 disabled:opacity-30">
                ↓
              </button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Tags({ q, value, onChange }: { q: Question; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t) && value.length < (q.max ?? 12)) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {value.map((t) => (
          <button key={t} type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="cx-chip cx-focus" aria-label={`Remove tag ${t}`}>
            {t} <span aria-hidden>×</span>
          </button>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={q.placeholder ?? 'Type a tag and press Enter'}
        aria-label={q.title}
        className="cx-focus w-full rounded-xl border px-4 py-2.5 text-sm"
        style={{ background: 'var(--cx-surface)', borderColor: 'var(--cx-glass-border)', color: 'var(--cx-text)' }}
      />
      <p className="cx-muted mt-1 text-xs">{value.length}/{q.max ?? 12} tags · press Enter to add</p>
    </div>
  );
}

function TextInput({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        maxLength={q.maxLength ?? 400}
        placeholder={q.placeholder}
        aria-label={q.title}
        className="cx-focus w-full rounded-xl border p-4 text-sm"
        style={{ background: 'var(--cx-surface)', borderColor: 'var(--cx-glass-border)', color: 'var(--cx-text)' }}
      />
      <p className="cx-muted mt-1 text-xs">
        {value.length}/{q.maxLength ?? 400}
      </p>
    </div>
  );
}
