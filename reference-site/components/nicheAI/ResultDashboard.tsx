'use client';

/**
 * Premium result dashboard. Renders the full intelligence report: hero score,
 * top niche, alternatives, radar + bar + opportunity charts, market analysis,
 * strengths/weaknesses, AI insights, action plan and growth roadmap, plus
 * save / share / print / PDF / email / retake actions.
 */

import { useState } from 'react';
import Link from 'next/link';
import { DIMENSIONS, type AnalysisResult, type Level, type NicheRecommendation } from '@/lib/nicheAI/types';
import { formatINRCompact } from '@/lib/currency';
import { BarChart, OpportunityMatrix, RadarChart, ScoreRing } from './Charts';

const levelColor = (l: Level) =>
  l === 'Low' ? '#3fae6b' : l === 'Medium' ? 'var(--cx-gold)' : l === 'High' ? '#e08a2b' : '#d0602b';

function Panel({ title, icon, children, className = '' }: { title: string; icon?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`cx-glass cx-fade-up p-6 ${className}`}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--cx-text)' }}>
        {icon ? <span aria-hidden>{icon}</span> : null} {title}
      </h3>
      {children}
    </section>
  );
}

function StatTile({ label, value, suffix = '', accent }: { label: string; value: number | string; suffix?: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: 'var(--cx-track)' }}>
      <div className="text-2xl font-extrabold" style={{ color: accent ?? 'var(--cx-text)' }}>
        {value}
        {suffix}
      </div>
      <div className="cx-muted mt-1 text-[11px] font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
}

function ListPanel({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  return (
    <Panel title={title} icon={icon}>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--cx-text)' }}>
            <span aria-hidden style={{ color: 'var(--cx-gold)' }}>
              ▸
            </span>
            {it}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function ResultDashboard({
  result,
  onRetake,
  onSave,
  onEmail,
  saved,
}: {
  result: AnalysisResult;
  onRetake: () => void;
  onSave: () => Promise<void> | void;
  onEmail: () => Promise<void> | void;
  saved: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const top = result.recommendations[0];
  const alts = result.recommendations.slice(1);

  async function run(key: string, fn: () => Promise<void> | void) {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }
  async function share() {
    const text = `My top coaching niche is ${top?.title} (${top?.nicheScore}/100) — found with CoachX.`;
    try {
      if (navigator.share) await navigator.share({ title: 'CoachX Niche Finder', text });
      else {
        await navigator.clipboard.writeText(text);
        alert('Result copied to clipboard.');
      }
    } catch {
      /* dismissed */
    }
  }

  if (!top) {
    return (
      <div className="cx-glass mx-auto max-w-lg p-8 text-center">
        <p style={{ color: 'var(--cx-text)' }}>We need a little more signal. Try adding more detail.</p>
        <button onClick={onRetake} className="cx-btn cx-btn-primary mt-4">
          Retake assessment
        </button>
      </div>
    );
  }

  const radarData = DIMENSIONS.map((d) => ({ label: d.label, value: result.profile[d.id] }));
  const rankBars = result.recommendations.map((r) => ({ label: r.title, value: r.nicheScore, hint: `${r.nicheScore}` }));
  const metricBars = [
    { label: 'Profitability', value: top.profitabilityScore },
    { label: 'Demand', value: top.demandScore },
    { label: 'Passion fit', value: top.passionScore },
    { label: 'Skill match', value: top.skillMatch },
    { label: 'Low competition', value: 100 - top.competitionScore },
    { label: 'Approachability', value: 100 - top.difficultyScore },
  ];
  const matrixPoints = result.recommendations.map((r, i) => ({ label: r.title, demand: r.demandScore, competition: r.competitionScore, top: i === 0 }));

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-16" data-testid="nf-result">
      {/* HERO */}
      <section className="cx-glass cx-fade-up overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreRing value={result.headlineScore} label="Niche score" />
          <div className="flex-1 text-center sm:text-left">
            <p className="cx-chip mb-2">🏆 Your best-fit niche</p>
            <h1 className="text-3xl font-extrabold sm:text-4xl cx-brandtext">{top.title}</h1>
            <p className="cx-muted mt-1 text-sm font-semibold">{top.categoryName}</p>
            <p className="mt-3 text-sm" style={{ color: 'var(--cx-text)' }}>
              {result.summary}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="cx-chip">🎯 {result.headlineConfidence}% confidence</span>
              <span className="cx-chip">💰 {top.revenuePotential.label}</span>
              <span className="cx-chip" style={{ color: levelColor(top.competitionLevel) }}>
                ⚔️ {top.competitionLevel} competition
              </span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="cx-noprint mt-6 flex flex-wrap gap-2 border-t pt-5" style={{ borderColor: 'var(--cx-glass-border)' }}>
          <button onClick={() => run('save', onSave)} disabled={saved || busy === 'save'} data-testid="nf-save" className="cx-btn cx-btn-primary cx-focus">
            {saved ? '✓ Saved' : busy === 'save' ? 'Saving…' : '💾 Save result'}
          </button>
          <button onClick={() => run('email', onEmail)} disabled={busy === 'email'} className="cx-btn cx-btn-ghost cx-focus">
            {busy === 'email' ? 'Sending…' : '✉️ Email me'}
          </button>
          <button onClick={() => window.print()} className="cx-btn cx-btn-ghost cx-focus">
            🖨️ Print
          </button>
          <button onClick={() => window.print()} className="cx-btn cx-btn-ghost cx-focus">
            ⬇️ Download PDF
          </button>
          <button onClick={share} className="cx-btn cx-btn-ghost cx-focus">
            🔗 Share
          </button>
          <button onClick={onRetake} data-testid="nf-retake" className="cx-btn cx-btn-ghost cx-focus">
            ↺ Retake
          </button>
        </div>
      </section>

      {/* TOP NICHE DETAIL */}
      <Panel title="Top recommended niche" icon="⭐">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Niche score" value={top.nicheScore} accent="var(--cx-gold)" />
          <StatTile label="Confidence" value={top.confidenceScore} suffix="%" />
          <StatTile label="Profitability" value={top.profitabilityScore} />
          <StatTile label="Demand" value={top.demandScore} />
          <StatTile label="Passion" value={top.passionScore} />
          <StatTile label="Skill match" value={top.skillMatch} />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="cx-muted text-xs font-bold uppercase">Coaching positioning</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--cx-text)' }}>{top.positioning}</p>
            <p className="cx-muted mt-3 text-xs font-bold uppercase">Unique value proposition</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--cx-text)' }}>{top.uvp}</p>
          </div>
          <div>
            <p className="cx-muted text-xs font-bold uppercase">Target audience</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--cx-text)' }}>{top.targetAudience}</p>
            <p className="cx-muted mt-3 text-xs font-bold uppercase">Sub-niches to own</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {top.subNiches.map((s) => (
                <span key={s} className="cx-chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* WHY THIS NICHE — explainability */}
      <Panel title={`Why ${top.title} scored ${top.nicheScore}`} icon="🔍">
        <p className="cx-muted mb-4 text-sm">Each factor is weighted, then combined. Here is exactly what drove your score.</p>
        <div className="space-y-2.5">
          {(top.scoreBreakdown ?? []).map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-semibold" style={{ color: 'var(--cx-text)' }}>{b.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--cx-track)' }}>
                <div className="h-full rounded-full" style={{ width: `${b.value}%`, background: 'linear-gradient(90deg,var(--cx-brand),var(--cx-gold))' }} />
              </div>
              <span className="cx-muted w-24 shrink-0 text-right text-xs">{b.value} × {Math.round(b.weight * 100)}% = <strong style={{ color: 'var(--cx-text)' }}>{b.contribution}</strong></span>
            </div>
          ))}
        </div>
      </Panel>

      {/* CHARTS ROW */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Your niche-fit profile" icon="🕸️">
          <div className="grid place-items-center">
            <RadarChart data={radarData} />
          </div>
        </Panel>
        <Panel title="Top niche — metric breakdown" icon="📊">
          <BarChart data={metricBars} />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Top 5 niches ranked" icon="🏅">
          <BarChart data={rankBars} />
        </Panel>
        <Panel title="Opportunity matrix" icon="🎯">
          <div className="grid place-items-center">
            <OpportunityMatrix points={matrixPoints} />
          </div>
          <p className="cx-muted mt-2 text-center text-xs">Upper-right = high demand, low competition (the sweet spot).</p>
        </Panel>
      </div>

      {/* STRENGTHS / WEAKNESSES */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ListPanel title="Strength analysis" icon="💪" items={top.strengths} />
        <ListPanel title="Growth areas" icon="🌱" items={top.weaknesses} />
      </div>

      {/* MARKET ANALYSIS */}
      <Panel title="Market analysis" icon="📈">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Demand" value={top.demandScore} />
          <StatTile label="Competition" value={top.competitionScore} accent={levelColor(top.competitionLevel)} />
          <StatTile label="Difficulty" value={top.difficultyScore} accent={levelColor(top.difficultyLevel)} />
          <StatTile label="Revenue / mo" value={formatINRCompact(top.revenuePotential.high)} accent="var(--cx-gold)" />
        </div>
        <p className="cx-muted mt-3 text-xs">{top.revenuePotential.note}</p>
      </Panel>

      {/* AI INSIGHTS */}
      <ListPanel title="AI insights" icon="🧠" items={result.insights} />

      {/* OPPORTUNITY / CONTENT GRID */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ListPanel title="Business opportunities" icon="🚀" items={top.businessOpportunities} />
        <ListPanel title="Content pillars" icon="✍️" items={top.contentPillars} />
        <ListPanel title="Offer ideas" icon="🎁" items={top.offerIdeas} />
        <ListPanel title="Product ideas" icon="📦" items={top.productIdeas} />
        <ListPanel title="Community ideas" icon="🌐" items={top.communityIdeas} />
        <ListPanel title="Pricing suggestions" icon="💲" items={top.pricingSuggestions} />
        <ListPanel title="Marketing suggestions" icon="📣" items={top.marketingSuggestions} />
        <ListPanel title="Funnel recommendation" icon="🫗" items={top.funnelRecommendation} />
      </div>

      {/* ROADMAP */}
      <Panel title="Growth roadmap" icon="🗺️">
        <ol className="space-y-3">
          {top.growthRoadmap.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-extrabold" style={{ background: 'var(--cx-brand)', color: '#fff' }}>
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--cx-text)' }}>{p.phase}</p>
                <p className="cx-muted text-sm">{p.focus}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* 90-DAY PLAN */}
      <Panel title="Your 90-day action plan" icon="✅">
        <div className="grid gap-4 sm:grid-cols-3">
          {top.actionPlan90Day.map((w, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--cx-track)' }}>
              <p className="text-sm font-extrabold" style={{ color: 'var(--cx-gold)' }}>{w.window}</p>
              <p className="cx-muted mb-2 mt-0.5 text-xs">{w.goal}</p>
              <ul className="space-y-1.5">
                {w.steps.map((s, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--cx-text)' }}>
                    <span aria-hidden>☐</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      {/* ALTERNATIVES */}
      <Panel title="Alternative niches" icon="🔀">
        <div className="grid gap-3 sm:grid-cols-2">
          {alts.map((a: NicheRecommendation) => (
            <div key={a.nicheId} className="rounded-2xl p-4" style={{ background: 'var(--cx-track)' }}>
              <div className="flex items-center justify-between">
                <span className="cx-chip">{a.categoryName}</span>
                <span className="text-sm font-extrabold" style={{ color: 'var(--cx-gold)' }}>{a.nicheScore}</span>
              </div>
              <h4 className="mt-2 font-bold" style={{ color: 'var(--cx-text)' }}>{a.title}</h4>
              <p className="cx-muted mt-1 text-xs">{a.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {a.subNiches.slice(0, 3).map((s) => (
                  <span key={s} className="cx-chip !text-[10px]">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* NEXT STEPS + CTA */}
      <Panel title="Do this next" icon="🎬">
        <ol className="space-y-2">
          {result.actionSteps.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--cx-text)' }}>
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-extrabold" style={{ background: 'var(--cx-gold)', color: '#23180a' }}>
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </Panel>

      <section className="cx-glass cx-noprint p-6 text-center" style={{ background: 'linear-gradient(120deg, rgba(16,80,48,0.22), rgba(208,160,48,0.16))' }}>
        <h3 className="text-xl font-extrabold" style={{ color: 'var(--cx-text)' }}>Ready to turn {top.title} into a real business?</h3>
        <p className="cx-muted mx-auto mt-2 max-w-xl text-sm">Get the system, templates and coaching to launch your niche with confidence.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/masterclass" className="cx-btn cx-btn-gold">Reserve your masterclass spot</Link>
          <Link href="/programs" className="cx-btn cx-btn-ghost">Explore programs</Link>
        </div>
      </section>

      {result.meta.engine === 'coachx-intelligence-offline' ? (
        <p className="cx-muted text-center text-xs">Generated offline — reconnect to sync this report to your account.</p>
      ) : null}
    </div>
  );
}
