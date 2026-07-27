'use client';

/**
 * "AI processing" screen shown while the intelligence engine runs. Staged,
 * animated status messages give the analysis weight and premium feel. The
 * engine itself is synchronous, so `onDone` fires after the scripted sequence.
 */

import { useEffect, useState } from 'react';

const STAGES = [
  'Reading your passion & skill signals…',
  'Scoring 24 niches across profitability & demand…',
  'Modelling competition and difficulty…',
  'Matching you to your top 5 niches…',
  'Writing your positioning & 90-day plan…',
  'Finalising your intelligence report…',
];

export function Processing({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= STAGES.length) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s + 1), 620);
    return () => clearTimeout(t);
  }, [stage, onDone]);

  const pct = Math.min(100, Math.round((stage / STAGES.length) * 100));

  return (
    <div className="mx-auto max-w-lg text-center" role="status" aria-live="polite">
      <div className="cx-glass cx-fade-up p-10">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <div className="cx-spin absolute inset-0 rounded-full" style={{ border: '3px solid var(--cx-track)', borderTopColor: 'var(--cx-gold)' }} />
          <div className="cx-float text-4xl">🧠</div>
        </div>
        <h2 className="mt-6 text-xl font-extrabold cx-brandtext">CoachX Intelligence at work</h2>
        <p className="cx-muted mt-2 min-h-[2.5rem] text-sm transition-all">{STAGES[Math.min(stage, STAGES.length - 1)]}</p>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--cx-track)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--cx-brand), var(--cx-gold))', transition: 'width 0.5s ease' }}
          />
        </div>
        <p className="cx-muted mt-3 text-xs font-semibold">{pct}%</p>
      </div>
    </div>
  );
}
