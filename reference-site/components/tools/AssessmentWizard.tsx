'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Answers, AnswerValue, Question } from '@/lib/tools/types';
import { storageKey } from '@/lib/tools/types';
import { isAnswered } from '@/lib/tools/engine';
import { engineToolBySlug } from '@/lib/tools/configs';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginRequiredModal } from '@/components/auth/LoginRequiredModal';
import { ResultView } from './ResultViews';

type Phase = 'start' | 'steps' | 'result';
interface Saved {
  phase: Phase;
  stepIndex: number;
  answers: Answers;
}

/**
 * Config-driven assessment engine shared by all CoachX tools. Handles the full
 * lifecycle: start → multi-step → validation → prev/next → progress → saved
 * progress (localStorage) → result → restart. Accessible and mobile-first.
 */
export function AssessmentWizard({ slug }: { slug: string }) {
  // The parent route calls notFound() for unknown slugs, so this is always set.
  const config = engineToolBySlug(slug)!;
  const key = storageKey(slug);
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('start');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showError, setShowError] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hydrated = useRef(false);

  // Restore saved progress on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        if (saved && saved.answers) {
          setAnswers(saved.answers);
          setStepIndex(Math.min(saved.stepIndex ?? 0, config.steps.length - 1));
          if (saved.phase === 'steps') setResumed(true);
        }
      }
    } catch {
      /* ignore corrupt state */
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist progress whenever it changes (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      if (phase === 'steps') localStorage.setItem(key, JSON.stringify({ phase, stepIndex, answers } satisfies Saved));
    } catch {
      /* ignore quota errors */
    }
  }, [phase, stepIndex, answers, key]);

  // Move focus to the step heading on step change (a11y).
  useEffect(() => {
    if (phase === 'steps') headingRef.current?.focus();
  }, [stepIndex, phase]);

  const step = config.steps[stepIndex];
  const isLast = stepIndex === config.steps.length - 1;
  const progress = Math.round(((stepIndex + (phase === 'result' ? 1 : 0)) / config.steps.length) * 100);
  const valid = step ? isAnswered(step, answers[step.id]) : true;

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setShowError(false);
  }
  function toggleMulti(id: string, value: string) {
    setAnswers((a) => {
      const arr = Array.isArray(a[id]) ? (a[id] as string[]) : [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...a, [id]: next };
    });
    setShowError(false);
  }

  /** Record the completed assessment into the unified store (Admin panel). */
  function recordCompletion() {
    try {
      const result = config.score(answers);
      const summary =
        result.kind === 'persona' ? result.title
        : result.kind === 'scorecard' ? `${result.level} (${result.overall}%)`
        : result.kind === 'blueprint' ? `${result.readiness} (${result.overall}%)`
        : `${result.percent}% complete`;
      void fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          formKey: config.slug,
          formLabel: config.name,
          uid: user?.uid ?? null,
          name: user?.name ?? null,
          email: user?.email ?? null,
          answers: { result: summary, responses: answers },
          sourceUrl: pathname,
        }),
      }).catch(() => undefined);
    } catch {
      /* non-blocking */
    }
  }

  function begin() {
    if (!isAuthenticated) {
      setAuthModal(true);
      return;
    }
    setPhase('steps');
  }
  function next() {
    // Re-verify auth before advancing any step (covers mid-session expiry).
    if (!isAuthenticated) {
      setAuthModal(true);
      return;
    }
    if (!valid) {
      setShowError(true);
      return;
    }
    if (isLast) {
      setPhase('result');
      recordCompletion();
      try {
        localStorage.removeItem(key); // clear saved progress once completed
      } catch {
        /* ignore */
      }
    } else {
      setStepIndex((i) => i + 1);
    }
  }
  function back() {
    if (stepIndex === 0) setPhase('start');
    else setStepIndex((i) => i - 1);
    setShowError(false);
  }
  function restart() {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setAnswers({});
    setStepIndex(0);
    setShowError(false);
    setResumed(false);
    setPhase('start');
  }

  // ---------- Result ----------
  if (phase === 'result') {
    const data = config.score(answers);
    return (
      <div>
        <div className="mb-6 text-center">
          <p className="eyebrow">{config.name}</p>
          <h2 className="mt-1 text-h2">Your result</h2>
        </div>
        <ResultView data={data} toolName={config.name} toolSlug={config.slug} />
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={restart} className="btn-secondary btn-fx-icon" data-testid="restart">
            <span className="btn-ico" aria-hidden="true">↺</span>
            <span className="btn-label">Start over</span>
          </button>
          <Link href="/tools" className="btn-ghost btn-fx-nav">
            <span className="btn-label">All tools</span>
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Start screen ----------
  if (phase === 'start') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-card border border-slate-200 bg-white p-8 text-center shadow-soft">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-card bg-blush text-3xl">{config.icon}</div>
          <h2 className="mt-5 text-h3">{config.start.headline}</h2>
          <p className="mt-3 text-slate-500">{config.start.sub}</p>
          <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2 text-left">
            {config.start.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-teal">✓</span> {b}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={begin} className="btn-primary btn-fx-sweep text-base" data-testid="start">
              <span className="btn-label">{resumed ? 'Resume where I left off' : 'Start now'}</span>
              <span className="btn-ico" aria-hidden="true">→</span>
            </button>
            {resumed ? (
              <button onClick={restart} className="btn-secondary btn-fx-lift text-base">
                <span className="btn-label">Start fresh</span>
              </button>
            ) : null}
          </div>
          <p className="mt-4 text-xs text-slate-400">~{config.estMinutes} min · progress saved on this device</p>
        </div>
        <LoginRequiredModal open={authModal} onCancel={() => setAuthModal(false)} next={pathname} />
      </div>
    );
  }

  // ---------- Steps ----------
  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span data-testid="progress-label">
            Step {stepIndex + 1} of {config.steps.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-pill bg-slate-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-pill bg-teal transition-all duration-300" style={{ width: `${Math.max(6, progress)}%` }} />
        </div>
      </div>

      <div className="rounded-card border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <StepFields
          step={step}
          answers={answers}
          headingRef={headingRef}
          onSingle={(v) => setAnswer(step.id, v)}
          onMulti={(v) => toggleMulti(step.id, v)}
          onScale={(v) => setAnswer(step.id, v)}
          onText={(v) => setAnswer(step.id, v)}
        />

        {showError && !valid ? (
          <p className="mt-4 rounded-card bg-teal/10 px-4 py-2 text-sm font-medium text-teal-dark" role="alert" data-testid="error">
            {step.type === 'multi' ? `Please select at least ${step.min ?? 1}.` : 'Please answer to continue.'}
          </p>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <button onClick={back} className="btn-ghost btn-fx-step" data-dir="back" data-testid="back">
            <span className="btn-ico" aria-hidden="true">←</span>
            <span className="btn-label">Back</span>
          </button>
          <button
            onClick={next}
            className={`btn-primary ${isLast ? 'btn-fx-ai' : 'btn-fx-step'}`}
            data-ready={valid ? 'true' : undefined}
            data-testid="next"
          >
            <span className="btn-label">{isLast ? 'See my result' : 'Next'}</span>
            {isLast ? null : <span className="btn-ico" aria-hidden="true">→</span>}
          </button>
        </div>
      </div>
      <LoginRequiredModal open={authModal} onCancel={() => setAuthModal(false)} next={pathname} />
    </div>
  );
}

function StepFields({
  step,
  answers,
  headingRef,
  onSingle,
  onMulti,
  onScale,
  onText,
}: {
  step: Question;
  answers: Answers;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onSingle: (v: string) => void;
  onMulti: (v: string) => void;
  onScale: (v: number) => void;
  onText: (v: string) => void;
}) {
  const a = answers[step.id];

  return (
    <fieldset>
      <legend className="w-full">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-ink outline-none sm:text-2xl">
          {step.title}
        </h2>
        {step.help ? <p className="mt-1 text-sm text-slate-500">{step.help}</p> : null}
      </legend>

      <div className="mt-6">
        {step.type === 'text' ? (
          <textarea
            value={typeof a === 'string' ? a : ''}
            onChange={(e) => onText(e.target.value)}
            rows={4}
            maxLength={step.maxLength ?? 500}
            placeholder={step.placeholder}
            className="w-full rounded-card border border-slate-300 bg-white p-4 text-sm text-ink placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
          />
        ) : step.type === 'scale' && step.scale ? (
          <div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={step.title}>
              {Array.from({ length: step.scale.max - step.scale.min + 1 }, (_, i) => step.scale!.min + i).map((n) => {
                const active = a === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onScale(n)}
                    className={`h-12 flex-1 rounded-card border text-lg font-bold transition-all ${
                      active ? 'border-teal bg-teal text-white' : 'border-slate-200 bg-white text-ink hover:border-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>{step.scale.minLabel}</span>
              <span>{step.scale.maxLabel}</span>
            </div>
          </div>
        ) : step.options ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {step.options.map((opt) => {
              const isMulti = step.type === 'multi';
              const active = isMulti ? Array.isArray(a) && a.includes(opt.value) : a === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role={isMulti ? 'checkbox' : 'radio'}
                  aria-checked={active}
                  onClick={() => (isMulti ? onMulti(opt.value) : onSingle(opt.value))}
                  className={`flex items-start gap-3 rounded-card border p-4 text-left transition-all ${
                    active ? 'border-teal bg-teal/5 ring-1 ring-teal' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.icon ? <span className="text-xl">{opt.icon}</span> : null}
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-ink">{opt.label}</span>
                    {opt.hint ? <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span> : null}
                  </span>
                  <span
                    className={`ml-auto grid h-5 w-5 shrink-0 place-items-center border text-xs ${isMulti ? 'rounded' : 'rounded-pill'} ${
                      active ? 'border-teal bg-teal text-white' : 'border-slate-300 text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}
