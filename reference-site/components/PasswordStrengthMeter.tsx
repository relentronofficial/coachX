'use client';

import { useMemo } from 'react';
import { scorePassword } from '@/lib/passwordStrength';

const BAR_COLORS = ['bg-red-400', 'bg-red-400', 'bg-amber', 'bg-teal', 'bg-teal'];
const TEXT_COLORS = ['text-red-500', 'text-red-500', 'text-amber-dark', 'text-teal', 'text-teal'];

/** Visual 4-segment strength meter + label/suggestions. Hidden when empty. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => scorePassword(password), [password]);
  if (!password) return null;

  return (
    <div data-testid="pw-strength">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-pill transition-colors ${i < strength.score ? BAR_COLORS[strength.score] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className={`font-semibold ${TEXT_COLORS[strength.score]}`} data-testid="pw-strength-label">
          {strength.label}
        </span>
        {strength.suggestions.length ? <span className="text-slate-400">{strength.suggestions[0]}</span> : null}
      </div>
    </div>
  );
}
