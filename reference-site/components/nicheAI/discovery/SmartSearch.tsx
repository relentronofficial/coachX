'use client';

/**
 * Smart search box for the discovery experience.
 *
 * All the intelligence already lives in the engine — `suggestSearch` is indexed,
 * typo-tolerant (Damerau ≤ 1 against the vocabulary) and synonym-aware. This
 * component's job is purely to expose it well: instant suggestions, recent and
 * popular searches when the box is empty, and full keyboard control.
 *
 * The listbox follows the combobox pattern: the input keeps focus and owns
 * `aria-activedescendant`, so arrow keys move the highlight without moving
 * focus and screen readers announce the active option.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { suggestSearch, type Suggestion } from '@/lib/nicheAI/topicEngine';
import { popularSearches, readRecentSearches } from '@/lib/nicheAI/topicStats';

const KIND_ICON: Record<Suggestion['kind'], string> = {
  topic: '🔎',
  category: '📁',
  subcategory: '📂',
  synonym: '💡',
};

const KIND_LABEL: Record<Suggestion['kind'], string> = {
  topic: 'Niche',
  category: 'Category',
  subcategory: 'Subcategory',
  synonym: 'Did you mean',
};

export function SmartSearch({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search 10,000+ niches — try “coach”, “fitness”, “make money”…',
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Commit a query (Enter, or picking a suggestion). */
  onSubmit: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<{ recent: string[]; popular: string[] }>({ recent: [], popular: [] });
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // localStorage is only readable after mount.
  useEffect(() => {
    setHistory({ recent: readRecentSearches(), popular: popularSearches() });
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const trimmed = value.trim();
  const suggestions = trimmed.length >= 2 ? suggestSearch(trimmed, 8) : [];
  // With no query the panel offers history instead of suggestions.
  const quick = trimmed.length >= 2 ? [] : [...history.recent.slice(0, 5), ...history.popular.filter((p) => !history.recent.includes(p)).slice(0, 4)];
  const rows: string[] = trimmed.length >= 2 ? suggestions.map((s) => s.text) : quick;
  const showPanel = open && rows.length > 0;

  function commit(query: string) {
    onChange(query);
    onSubmit(query);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!showPanel) {
      if (e.key === 'Enter' && trimmed) commit(trimmed);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(active >= 0 ? rows[active] : trimmed);
    }
  }

  return (
    <div ref={boxRef} className="relative" data-testid="nf-smart-search">
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base">
          🔍
        </span>
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-label="Search niches"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          data-testid="nf-search-input"
          className="cx-focus w-full rounded-full py-3 pl-11 pr-11 text-sm font-medium"
          style={{
            background: 'var(--cx-surface-solid)',
            border: '1px solid var(--cx-glass-border)',
            color: 'var(--cx-text)',
          }}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onSubmit('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="cx-focus absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 text-lg leading-none"
            style={{ color: 'var(--cx-muted)' }}
          >
            ×
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-label={trimmed.length >= 2 ? 'Search suggestions' : 'Recent and popular searches'}
          data-testid="nf-search-suggestions"
          className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto p-1.5"
          style={{
            background: 'var(--cx-surface-solid)',
            border: '1px solid var(--cx-glass-border)',
            borderRadius: 16,
            boxShadow: 'var(--cx-shadow)',
          }}
        >
          {trimmed.length < 2 ? (
            <li className="cx-muted px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide" aria-hidden="true">
              {history.recent.length ? 'Recent & popular searches' : 'Popular searches'}
            </li>
          ) : null}
          {rows.map((text, i) => {
            const s = suggestions[i];
            const isRecent = trimmed.length < 2 && history.recent.includes(text);
            return (
              <li key={`${text}-${i}`} id={`${id}-opt-${i}`} role="option" aria-selected={active === i}>
                <button
                  type="button"
                  // onMouseDown so the click lands before the input blurs.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(text);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm"
                  style={{
                    background: active === i ? 'var(--cx-track)' : 'transparent',
                    color: 'var(--cx-text)',
                  }}
                >
                  <span aria-hidden="true" className="text-xs">
                    {s ? KIND_ICON[s.kind] : isRecent ? '🕘' : '🔥'}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{text}</span>
                  <span className="cx-muted shrink-0 text-[10px] font-semibold uppercase tracking-wide">
                    {s ? KIND_LABEL[s.kind] : isRecent ? 'Recent' : 'Popular'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
