import Link from 'next/link';
import type { ResultData } from '@/lib/tools/types';
import { WeakTopicsRecommendation } from './WeakTopicsRecommendation';

/** Circular percentage dial (brand green). */
function Dial({ percent, size = 96 }: { percent: number; size?: number }) {
  const deg = Math.round((percent / 100) * 360);
  const inner = size - 28;
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: `conic-gradient(#105030 ${deg}deg, #e2e8f0 ${deg}deg)` }}
      role="img"
      aria-label={`${percent} percent`}
    >
      <div className="grid place-items-center rounded-full bg-white" style={{ width: inner, height: inner }}>
        <span className="text-xl font-extrabold text-ink">{percent}%</span>
      </div>
    </div>
  );
}

function Bar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-bold text-teal">{score}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-pill bg-slate-100">
        <div className="h-full rounded-pill bg-teal transition-all duration-500" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function List({ title, items, mark }: { title: string; items: string[]; mark: string }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="text-sm font-bold uppercase tracking-wide text-ink">{title}</h4>
      <ul className="mt-2 space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
            <span className="mt-0.5 text-teal">{mark}</span> {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Shared tail of every result card: the low-clarity nudge (when the scores
 * warrant one) followed by the standard CTAs. Every `kind` branch below ends
 * with this, so the recommendation reaches all six tools from one place.
 */
function ResultFooter({ data, toolName, toolSlug }: { data: ResultData; toolName?: string; toolSlug?: string }) {
  return (
    <>
      <WeakTopicsRecommendation data={data} toolName={toolName} toolSlug={toolSlug} />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/masterclass" className="btn-amber btn-fx-sweep">
          <span className="btn-label">Turn this into a plan — reserve your spot</span>
          <span className="btn-ico" aria-hidden="true">→</span>
        </Link>
        <Link href="/tools" className="btn-secondary btn-fx-lift">
          <span className="btn-label">Explore more tools</span>
        </Link>
      </div>
    </>
  );
}

/** Renders any tool result by its discriminated `kind`. */
export function ResultView({ data, toolName, toolSlug }: { data: ResultData; toolName?: string; toolSlug?: string }) {
  if (data.kind === 'persona') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-card border-2 border-teal bg-white p-6 shadow-glow sm:p-8">
          <p className="eyebrow">Your persona</p>
          <h3 className="mt-1 text-3xl font-extrabold text-ink">{data.title}</h3>
          <p className="mt-1 text-lg text-teal">{data.tagline}</p>
          <p className="mt-3 text-slate-600">{data.blurb}</p>
          <div className="mt-6 space-y-3">
            {data.traits.map((t) => (
              <Bar key={t.label} label={t.label} score={t.value} />
            ))}
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <List title="Strengths" items={data.strengths} mark="✓" />
            <List title="Watch-outs" items={data.watchouts} mark="!" />
          </div>
          <div className="mt-6">
            <List title="Recommended next steps" items={data.recommendations} mark="→" />
          </div>
          <ResultFooter data={data} toolName={toolName} toolSlug={toolSlug} />
        </div>
      </div>
    );
  }

  if (data.kind === 'scorecard') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-card border-2 border-teal bg-white p-6 shadow-glow sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Your scorecard</p>
              <h3 className="mt-1 text-2xl font-extrabold text-ink">{data.level}</h3>
              <p className="mt-1 max-w-md text-slate-600">{data.levelBlurb}</p>
            </div>
            <Dial percent={data.overall} />
          </div>
          <div className="mt-6 space-y-3">
            {data.dimensions.map((d) => (
              <Bar key={d.id} label={d.label} score={d.score} />
            ))}
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <List title="Strengths" items={data.strengths} mark="✓" />
            <List title="Focus areas" items={data.gaps} mark="→" />
          </div>
          <div className="mt-6">
            <List title="Do this next" items={data.recommendations} mark="✦" />
          </div>
          <ResultFooter data={data} toolName={toolName} toolSlug={toolSlug} />
        </div>
      </div>
    );
  }

  if (data.kind === 'blueprint') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-card border-2 border-teal bg-white p-6 shadow-glow sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Your blueprint</p>
              <h3 className="mt-1 text-2xl font-extrabold text-ink">{data.readiness}</h3>
              <p className="mt-1 text-slate-600">Overall readiness across the four pillars.</p>
            </div>
            <Dial percent={data.overall} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {data.pillars.map((p) => (
              <div key={p.id} className="rounded-card border border-slate-200 p-4">
                <Bar label={p.label} score={p.score} />
                <p className="mt-2 text-sm text-slate-500">{p.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <List title="Your next actions" items={data.actions} mark="→" />
          </div>
          <ResultFooter data={data} toolName={toolName} toolSlug={toolSlug} />
        </div>
      </div>
    );
  }

  // challenge
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-card border-2 border-teal bg-white p-6 text-center shadow-glow sm:p-8">
        <div className="mx-auto flex justify-center">
          <Dial percent={data.percent} size={120} />
        </div>
        <h3 className="mt-4 text-2xl font-extrabold text-ink">{data.level}</h3>
        <p className="mt-1 text-slate-600">{data.blurb}</p>
        <p className="mt-3 inline-block rounded-pill bg-blush px-4 py-1 text-sm font-semibold text-teal">
          {data.completed} / {data.total} tasks complete
        </p>
        <div className="mt-6 text-left">
          <List title="Next steps" items={data.nextSteps} mark="→" />
        </div>
        <ResultFooter data={data} toolName={toolName} toolSlug={toolSlug} />
      </div>
    </div>
  );
}
