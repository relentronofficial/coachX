'use client';

/** Side-by-side comparison of two saved results. */

import { DIMENSIONS, type AnalysisResult } from '@/lib/nicheAI/types';
import { CompareBars, RadarChart } from './Charts';

export function Comparison({ a, b, onBack }: { a: AnalysisResult; b: AnalysisResult; onBack: () => void }) {
  const topA = a.recommendations[0];
  const topB = b.recommendations[0];

  const dimData = DIMENSIONS.map((d) => ({ label: d.label, a: a.profile[d.id], b: b.profile[d.id] }));
  const metricData = [
    { label: 'Niche score', a: a.headlineScore, b: b.headlineScore },
    { label: 'Confidence', a: a.headlineConfidence, b: b.headlineConfidence },
    { label: 'Profitability', a: topA?.profitabilityScore ?? 0, b: topB?.profitabilityScore ?? 0 },
    { label: 'Demand', a: topA?.demandScore ?? 0, b: topB?.demandScore ?? 0 },
    { label: 'Passion fit', a: topA?.passionScore ?? 0, b: topB?.passionScore ?? 0 },
    { label: 'Skill match', a: topA?.skillMatch ?? 0, b: topB?.skillMatch ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5 cx-fade-up">
      <div className="flex items-center gap-3">
        <h1 className="mr-auto text-2xl font-extrabold" style={{ color: 'var(--cx-text)' }}>Compare results</h1>
        <button onClick={onBack} className="cx-btn cx-btn-ghost cx-focus">← Back</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { r: a, top: topA, tag: 'A', color: 'var(--cx-brand)' },
          { r: b, top: topB, tag: 'B', color: 'var(--cx-gold)' },
        ].map(({ r, top, tag, color }) => (
          <div key={tag} className="cx-glass p-6 text-center">
            <span className="cx-chip" style={{ background: color, color: '#fff' }}>Result {tag}</span>
            <div className="mt-3 text-4xl font-extrabold" style={{ color: 'var(--cx-text)' }}>{r.headlineScore}</div>
            <p className="mt-1 font-bold cx-brandtext">{top?.title}</p>
            <p className="cx-muted text-xs">{top?.categoryName} · {r.headlineConfidence}% confidence</p>
          </div>
        ))}
      </div>

      <section className="cx-glass p-6">
        <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--cx-text)' }}>Metric comparison</h3>
        <CompareBars data={metricData} labelA={`A · ${topA?.title ?? ''}`} labelB={`B · ${topB?.title ?? ''}`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cx-glass p-6">
          <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--cx-text)' }}>Profile — A</h3>
          <div className="grid place-items-center"><RadarChart data={DIMENSIONS.map((d) => ({ label: d.label, value: a.profile[d.id] }))} /></div>
        </section>
        <section className="cx-glass p-6">
          <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--cx-text)' }}>Profile — B</h3>
          <div className="grid place-items-center"><RadarChart data={DIMENSIONS.map((d) => ({ label: d.label, value: b.profile[d.id] }))} /></div>
        </section>
      </div>

      <section className="cx-glass p-6">
        <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--cx-text)' }}>What changed</h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--cx-text)' }}>
          <li>Headline score moved <strong>{b.headlineScore - a.headlineScore >= 0 ? '+' : ''}{b.headlineScore - a.headlineScore}</strong> points (A → B).</li>
          {topA?.title !== topB?.title ? (
            <li>Top niche shifted from <strong>{topA?.title}</strong> to <strong>{topB?.title}</strong>.</li>
          ) : (
            <li>Top niche stayed <strong>{topA?.title}</strong> — a consistent direction.</li>
          )}
          {dimData
            .map((d) => ({ ...d, delta: d.b - d.a }))
            .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
            .slice(0, 2)
            .map((d) => (
              <li key={d.label}>Biggest profile change: <strong>{d.label}</strong> {d.delta >= 0 ? '+' : ''}{d.delta}.</li>
            ))}
        </ul>
      </section>
    </div>
  );
}
