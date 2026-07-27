'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { wizardSteps, type WizardStep } from '@/lib/niches';
import { scoreNiches, type NicheAnswers, type NicheResult } from '@/lib/nicheScore';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginRequiredModal } from '@/components/auth/LoginRequiredModal';

type Phase = 'form' | 'loading' | 'results' | 'error';

const STORAGE_KEY = 'cx-tool-niche-finder';

const emptyAnswers: NicheAnswers = {
  categories: [],
  audience: null,
  delivery: [],
  goal: null,
  background: '',
};

export function NicheFinder() {
  const [phase, setPhase] = useState<Phase>('form');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<NicheAnswers>(emptyAnswers);
  const [result, setResult] = useState<NicheResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const hydrated = useRef(false);

  function recordCompletion(res: NicheResult) {
    void fetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        formKey: 'niche-finder',
        formLabel: 'Niche Finder',
        uid: user?.uid ?? null,
        name: user?.name ?? null,
        email: user?.email ?? null,
        answers: { topNiche: res.matches[0]?.title ?? null, topCategory: res.topCategory, responses: answers },
        sourceUrl: pathname,
      }),
    }).catch(() => undefined);
  }

  // Restore saved progress on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { stepIndex: number; answers: NicheAnswers };
        if (saved?.answers) {
          setAnswers(saved.answers);
          setStepIndex(Math.min(saved.stepIndex ?? 0, wizardSteps.length - 1));
        }
      }
    } catch {
      /* ignore corrupt state */
    }
    hydrated.current = true;
  }, []);

  // Persist while filling the form; clear once results are shown.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      if (phase === 'form') localStorage.setItem(STORAGE_KEY, JSON.stringify({ stepIndex, answers }));
      else if (phase === 'results') localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore quota errors */
    }
  }, [phase, stepIndex, answers]);

  const step = wizardSteps[stepIndex];
  const isLast = stepIndex === wizardSteps.length - 1;
  const progress = Math.round(((stepIndex + (phase === 'results' ? 1 : 0)) / wizardSteps.length) * 100);

  const selectedFor = (s: WizardStep): string[] => {
    if (s.id === 'categories') return answers.categories;
    if (s.id === 'delivery') return answers.delivery;
    if (s.id === 'audience') return answers.audience ? [answers.audience] : [];
    if (s.id === 'goal') return answers.goal ? [answers.goal] : [];
    return [];
  };

  const stepValid = useMemo(() => {
    if (step.kind === 'text') return true; // optional
    const sel = selectedFor(step);
    return sel.length >= (step.min ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, answers]);

  function toggleMulti(key: 'categories' | 'delivery', value: string) {
    setAnswers((a) => {
      const arr = a[key] as string[];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...a, [key]: next } as NicheAnswers;
    });
  }
  function setSingle(key: 'audience' | 'goal', value: string) {
    setAnswers((a) => ({ ...a, [key]: value } as NicheAnswers));
  }

  async function submit() {
    setPhase('loading');
    setError(null);
    setUsedFallback(false);
    try {
      const res = await fetch('/api/niche-finder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(answers),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status}).`);
      }
      const data = (await res.json()) as NicheResult;
      setResult(data);
      setPhase('results');
      recordCompletion(data);
    } catch (e) {
      // Resilient fallback: score locally with the same engine so the tool
      // still works if the API is unreachable.
      try {
        const local = scoreNiches(answers);
        setResult(local);
        setUsedFallback(true);
        setPhase('results');
        recordCompletion(local);
      } catch {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setPhase('error');
      }
    }
  }

  function next() {
    // Re-verify auth before advancing / submitting (covers mid-session expiry).
    if (!isAuthenticated) {
      setAuthModal(true);
      return;
    }
    if (!stepValid) return;
    if (isLast) void submit();
    else setStepIndex((i) => i + 1);
  }
  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }
  function restart() {
    setAnswers(emptyAnswers);
    setStepIndex(0);
    setResult(null);
    setError(null);
    setPhase('form');
  }

  // ---------- Results ----------
  if (phase === 'results' && result) {
    return (
      <ResultsView result={result} answers={answers} usedFallback={usedFallback} onRestart={restart} />
    );
  }

  // ---------- Error ----------
  if (phase === 'error') {
    return (
      <div className="mx-auto max-w-xl rounded-card border border-slate-200 bg-white p-8 text-center shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-pill bg-teal/10 text-2xl">⚠️</div>
        <h2 className="mt-4 text-xl font-bold text-ink">We couldn't score that</h2>
        <p className="mt-2 text-sm text-slate-500">{error ?? 'Please try again.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => void submit()} className="btn-primary">Try again</button>
          <button onClick={restart} className="btn-secondary">Start over</button>
        </div>
      </div>
    );
  }

  // ---------- Loading ----------
  if (phase === 'loading') {
    return (
      <div className="mx-auto max-w-xl rounded-card border border-slate-200 bg-white p-10 text-center shadow-soft">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal" />
        <p className="mt-5 font-semibold text-ink">Finding your best-fit niches…</p>
        <p className="mt-1 text-sm text-slate-500">Scoring {answers.categories.length} interest area(s).</p>
      </div>
    );
  }

  // ---------- Form (wizard) ----------
  const selected = selectedFor(step);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Step {stepIndex + 1} of {wizardSteps.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-pill bg-slate-100">
          <div className="h-full rounded-pill bg-teal transition-all duration-300" style={{ width: `${Math.max(6, progress)}%` }} />
        </div>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="text-xl font-bold text-ink sm:text-2xl">{step.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{step.help}</p>

        <div className="mt-6">
          {step.kind === 'text' ? (
            <textarea
              value={answers.background}
              onChange={(e) => setAnswers((a) => ({ ...a, background: e.target.value }))}
              rows={4}
              maxLength={500}
              placeholder="e.g. I'm a school teacher who loves helping people build confidence…"
              className="w-full rounded-card border border-slate-300 bg-white p-4 text-sm text-ink placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
            />
          ) : (
            <div className={`grid gap-3 ${step.id === 'categories' ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
              {step.options!.map((opt) => {
                const active = selected.includes(opt.value);
                const isMulti = step.kind === 'multi';
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      isMulti
                        ? toggleMulti(step.id as 'categories' | 'delivery', opt.value)
                        : setSingle(step.id as 'audience' | 'goal', opt.value)
                    }
                    className={`flex items-start gap-3 rounded-card border p-4 text-left transition-all ${
                      active
                        ? 'border-teal bg-teal/5 ring-1 ring-teal'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span>
                      <span className="block text-sm font-bold text-ink">{opt.label}</span>
                      {opt.hint ? <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span> : null}
                    </span>
                    <span
                      className={`ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-${isMulti ? 'md' : 'pill'} border ${
                        active ? 'border-teal bg-teal text-white' : 'border-slate-300 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={back}
            disabled={stepIndex === 0}
            className="btn-ghost disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            {!stepValid && step.kind !== 'text' ? (
              <span className="hidden text-xs text-slate-400 sm:inline">Select at least {step.min ?? 1} to continue</span>
            ) : null}
            <button onClick={next} disabled={!stepValid} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
              {isLast ? 'Discover my niches' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
      <LoginRequiredModal open={authModal} onCancel={() => setAuthModal(false)} next={pathname} />
    </div>
  );
}

function ResultsView({
  result,
  answers,
  usedFallback,
  onRestart,
}: {
  result: NicheResult;
  answers: NicheAnswers;
  usedFallback: boolean;
  onRestart: () => void;
}) {
  const [top, ...rest] = result.matches;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <p className="eyebrow">Your results</p>
        <h2 className="mt-2 text-h2">
          {result.weak ? 'A few directions to explore' : `Your best fit: ${result.topCategory}`}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          {result.weak
            ? 'Your answers were broad, so here are strong, beginner-friendly options to consider.'
            : 'Ranked by how well they match your interests, audience and preferred format.'}
        </p>
        {usedFallback ? (
          <p className="mt-2 text-xs text-amber-dark">Scored offline — reconnect to refresh from the server.</p>
        ) : null}
      </div>

      {top ? (
        <div className="mt-8 rounded-card border-2 border-teal bg-white p-6 shadow-glow sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded-pill bg-blush px-3 py-1 text-xs font-semibold text-violet">{top.categoryName}</span>
              <h3 className="mt-3 text-2xl font-extrabold text-ink">{top.title}</h3>
            </div>
            <MatchDial percent={top.matchPercent} />
          </div>
          <p className="mt-3 text-slate-600">{top.blurb}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {top.subNiches.map((s) => (
              <span key={s} className="rounded-pill bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {s}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-1.5">
            {top.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-0.5 text-teal">✓</span> {r}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/masterclass" className="btn-amber">
              Turn this into a business — reserve your spot
            </Link>
            <Link href="/programs" className="btn-secondary">
              Explore programs
            </Link>
          </div>
        </div>
      ) : null}

      {rest.length > 0 ? (
        <>
          <h3 className="mt-10 text-sm font-bold uppercase tracking-wide text-ink">More strong matches</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {rest.map((m) => (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between">
                  <span className="rounded-pill bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {m.categoryName}
                  </span>
                  <span className="text-sm font-extrabold text-teal">{m.matchPercent}%</span>
                </div>
                <h4 className="mt-3 text-lg font-bold text-ink">{m.title}</h4>
                <p className="mt-1 text-sm text-slate-500">{m.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.subNiches.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-pill bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button onClick={onRestart} className="btn-secondary">
          ↺ Start over
        </button>
        <Link href="/tools" className="btn-ghost">
          Back to tools
        </Link>
      </div>
    </div>
  );
}

function MatchDial({ percent }: { percent: number }) {
  const deg = Math.round((percent / 100) * 360);
  return (
    <div
      className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--dial) ${deg}deg, #e2e8f0 ${deg}deg)`, ['--dial' as string]: '#105030' }}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white">
        <span className="text-lg font-extrabold text-ink">{percent}%</span>
      </div>
    </div>
  );
}
