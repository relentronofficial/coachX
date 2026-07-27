'use client';

/**
 * The premium multi-step assessment. Branching-aware (visibleQuestions),
 * autosaving, keyboard-navigable, mobile-first and accessible.
 */

import { useEffect, useMemo, useRef } from 'react';
import type { AnswerValue, Answers, Question, QuestionCategory } from '@/lib/nicheAI/types';
import { isAnswered, visibleQuestions } from '@/lib/nicheAI/engine';
import { QuestionInput } from './QuestionInput';

export function Assessment({
  questions,
  categories,
  answers,
  stepIndex,
  onAnswer,
  onStep,
  onComplete,
  onExit,
}: {
  questions: Question[];
  categories: QuestionCategory[];
  answers: Answers;
  stepIndex: number;
  onAnswer: (id: string, v: AnswerValue) => void;
  onStep: (i: number) => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  const visible = useMemo(() => visibleQuestions(questions, answers), [questions, answers]);
  const idx = Math.min(stepIndex, visible.length - 1);
  const q = visible[idx];
  const cat = categories.find((c) => c.id === q?.categoryId);
  const total = visible.length;
  const progress = Math.round(((idx + (isAnswered(q, answers[q?.id]) ? 1 : 0)) / total) * 100);
  const valid = q ? isAnswered(q, answers[q.id]) : false;
  const isLast = idx === total - 1;
  const liveRef = useRef<HTMLDivElement>(null);

  // Distinct categories in order, for the stepper rail.
  const railCats = useMemo(() => {
    const seen = new Set<string>();
    return visible.map((v) => v.categoryId).filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
  }, [visible]);
  const activeCatIndex = railCats.indexOf(q?.categoryId ?? '');

  useEffect(() => {
    if (liveRef.current) liveRef.current.focus();
  }, [idx]);

  function next() {
    if (!valid) return;
    if (isLast) onComplete();
    else onStep(idx + 1);
  }
  function back() {
    if (idx === 0) onExit();
    else onStep(idx - 1);
  }

  if (!q) return null;

  return (
    <div
      className="mx-auto w-full max-w-3xl"
      data-testid="nf-assessment"
      onKeyDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (e.key === 'Enter' && tag !== 'TEXTAREA' && tag !== 'INPUT' && valid) {
          e.preventDefault();
          next();
        }
      }}
    >
      {/* Category rail */}
      <div className="mb-6 flex items-center gap-1.5" aria-hidden>
        {railCats.map((c, i) => (
          <div
            key={c}
            className="h-1.5 grow rounded-full transition-all"
            style={{ background: i <= activeCatIndex ? 'linear-gradient(90deg, var(--cx-brand), var(--cx-gold))' : 'var(--cx-track)' }}
          />
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between text-xs font-bold">
        <span className="cx-chip">
          {cat?.icon} {cat?.title}
        </span>
        <span className="cx-muted">
          Step {idx + 1} of {total} · {progress}%
        </span>
      </div>

      <div className="cx-glass cx-fade-up p-6 sm:p-8" key={q.id}>
        <div ref={liveRef} tabIndex={-1} aria-live="polite" className="cx-focus outline-none">
          <h2 className="text-xl font-extrabold sm:text-2xl" style={{ color: 'var(--cx-text)' }}>
            {q.title}
          </h2>
          {q.help ? <p className="cx-muted mt-1.5 text-sm">{q.help}</p> : null}
        </div>

        <div className="mt-6">
          <QuestionInput question={q} value={answers[q.id]} onChange={(v) => onAnswer(q.id, v)} />
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            data-testid="nf-back"
            data-dir="back"
            className="cx-btn cx-btn-ghost cx-focus btn-fx-step"
          >
            <span className="btn-ico" aria-hidden="true">←</span>
            <span className="btn-label">{idx === 0 ? 'Intro' : 'Back'}</span>
          </button>
          <div className="flex items-center gap-3">
            {!valid ? <span className="cx-muted hidden text-xs sm:inline" data-testid="nf-hint">Answer to continue</span> : null}
            {/* `data-ready` fires the one-shot pulse the moment the step becomes
                answerable, so "Next" announces itself without nagging. */}
            <button
              type="button"
              onClick={next}
              disabled={!valid}
              data-testid="nf-next"
              data-ready={valid ? 'true' : undefined}
              className={`cx-btn cx-focus ${isLast ? 'cx-btn-gold btn-fx-ai' : 'cx-btn-primary btn-fx-step'}`}
            >
              <span className="btn-label">{isLast ? '✨ Analyse my niches' : 'Next'}</span>
              {isLast ? null : <span className="btn-ico" aria-hidden="true">→</span>}
            </button>
          </div>
        </div>
      </div>

      <p className="cx-muted mt-4 text-center text-xs">
        Progress saves automatically — you can leave and resume anytime.
      </p>
    </div>
  );
}
