'use client';

/**
 * Original, dependency-free SVG data-viz for the result dashboard:
 * animated score ring, radar (spider) chart, and horizontal bar chart.
 * Colours come from the module's CSS variables so they theme automatically.
 */

import { useEffect, useState } from 'react';

const BRAND = 'var(--cx-brand)';
const GOLD = 'var(--cx-gold)';

/** Animated circular score gauge. */
export function ScoreRing({ value, size = 168, label }: { value: number; size?: number; label?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 60);
    return () => clearTimeout(t);
  }, [value]);
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (shown / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="cx-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={BRAND} />
            <stop offset="100%" stopColor={GOLD} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cx-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#cx-ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-extrabold" style={{ color: 'var(--cx-text)' }}>
          {Math.round(shown)}
        </div>
        {label ? <div className="cx-muted text-xs font-semibold uppercase tracking-wider">{label}</div> : null}
      </div>
    </div>
  );
}

/** Radar / spider chart for the 10-dimension profile. */
export function RadarChart({ data, size = 320 }: { data: { label: string; value: number }[]; size?: number }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setT(1), 80);
    return () => clearTimeout(id);
  }, []);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 42;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, val: number) => {
    const rad = (val / 100) * r * t;
    return [cx + rad * Math.cos(angle(i)), cy + rad * Math.sin(angle(i))];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const poly = data.map((d, i) => point(i, d.value).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm" role="img" aria-label="Your niche-fit profile across ten dimensions">
      <defs>
        <linearGradient id="cx-radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.5" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {rings.map((rr, idx) => (
        <polygon
          key={idx}
          points={data.map((_, i) => [cx + r * rr * Math.cos(angle(i)), cy + r * rr * Math.sin(angle(i))].join(',')).join(' ')}
          fill="none"
          stroke="var(--cx-track)"
          strokeWidth={1}
        />
      ))}
      {data.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))} stroke="var(--cx-track)" strokeWidth={1} />
      ))}
      <polygon points={poly} fill="url(#cx-radar-fill)" stroke={BRAND} strokeWidth={2} style={{ transition: 'all 1s ease' }} />
      {data.map((d, i) => {
        const [x, y] = [cx + (r + 20) * Math.cos(angle(i)), cy + (r + 20) * Math.sin(angle(i))];
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="var(--cx-muted)">
            {d.label}
          </text>
        );
      })}
      {data.map((d, i) => {
        const [x, y] = point(i, d.value);
        return <circle key={i} cx={x} cy={y} r={3} fill={GOLD} />;
      })}
    </svg>
  );
}

/** Horizontal animated bar chart (score comparison across niches / metrics). */
export function BarChart({ data }: { data: { label: string; value: number; hint?: string }[] }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setT(1), 80);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold">
            <span style={{ color: 'var(--cx-text)' }}>{d.label}</span>
            <span className="cx-muted">{d.hint ?? `${Math.round(d.value)}`}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--cx-track)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / 100) * 100 * t}%`,
                background: `linear-gradient(90deg, ${BRAND}, ${GOLD})`,
                transition: 'width 1s cubic-bezier(.22,1,.36,1)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Two-series comparison bars (e.g. this result vs a previous one). */
export function CompareBars({ data, labelA, labelB }: { data: { label: string; a: number; b: number }[]; labelA: string; labelB: string }) {
  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs font-semibold">
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: BRAND }} /> {labelA}</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: GOLD }} /> {labelB}</span>
      </div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold">
              <span style={{ color: 'var(--cx-text)' }}>{d.label}</span>
              <span className="cx-muted">{Math.round(d.a)} vs {Math.round(d.b)}{d.b - d.a !== 0 ? ` (${d.b - d.a > 0 ? '+' : ''}${Math.round(d.b - d.a)})` : ''}</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--cx-track)' }}>
                <div className="h-full rounded-full" style={{ width: `${d.a}%`, background: BRAND, transition: 'width 0.8s ease' }} />
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--cx-track)' }}>
                <div className="h-full rounded-full" style={{ width: `${d.b}%`, background: GOLD, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Trend line (e.g. headline score across past assessments). */
export function TrendLine({ points, height = 120 }: { points: { label: string; value: number }[]; height?: number }) {
  const w = 320;
  const pad = 24;
  if (points.length < 2) return <p className="cx-muted text-sm">Take another assessment to see your trend.</p>;
  const max = 100;
  const step = (w - pad * 2) / (points.length - 1);
  const x = (i: number) => pad + i * step;
  const y = (v: number) => pad + (1 - v / max) * (height - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label="Score trend across assessments">
      <path d={path} fill="none" stroke={BRAND} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r={3.5} fill={GOLD} />
          <text x={x(i)} y={height - 6} textAnchor="middle" fontSize="8" fill="var(--cx-muted)">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

/** Opportunity matrix — demand (x) vs competition (y) scatter with quadrants. */
export function OpportunityMatrix({ points, size = 300 }: { points: { label: string; demand: number; competition: number; top?: boolean }[]; size?: number }) {
  const pad = 34;
  const inner = size - pad * 2;
  const x = (v: number) => pad + (v / 100) * inner;
  const y = (v: number) => pad + (1 - v / 100) * inner;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm" role="img" aria-label="Opportunity matrix: demand versus competition">
      <rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke="var(--cx-track)" />
      <line x1={pad + inner / 2} y1={pad} x2={pad + inner / 2} y2={pad + inner} stroke="var(--cx-track)" strokeDasharray="4 4" />
      <line x1={pad} y1={pad + inner / 2} x2={pad + inner} y2={pad + inner / 2} stroke="var(--cx-track)" strokeDasharray="4 4" />
      <text x={pad + inner / 2} y={size - 8} textAnchor="middle" fontSize="9" fill="var(--cx-muted)" fontWeight="700">
        Demand →
      </text>
      <text x={12} y={pad + inner / 2} textAnchor="middle" fontSize="9" fill="var(--cx-muted)" fontWeight="700" transform={`rotate(-90 12 ${pad + inner / 2})`}>
        ← Less competition
      </text>
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(p.demand)} cy={y(100 - p.competition)} r={p.top ? 8 : 5} fill={p.top ? GOLD : BRAND} opacity={p.top ? 1 : 0.7}>
            <title>{`${p.label} — demand ${p.demand}, competition ${p.competition}`}</title>
          </circle>
          {p.top ? (
            <text x={x(p.demand)} y={y(100 - p.competition) - 12} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--cx-text)">
              {p.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
