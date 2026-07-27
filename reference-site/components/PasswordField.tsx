'use client';

import { useState, type ReactNode } from 'react';

/**
 * Password input with a show/hide toggle. Keeps the same styling, id and
 * autocomplete as the plain inputs it replaces.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  labelRight,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  labelRight?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-600">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-pill border border-slate-300 pl-5 pr-12 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          data-testid={`toggle-${id}`}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-pill text-slate-400 hover:bg-slate-100 hover:text-ink"
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}
