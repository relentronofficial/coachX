'use client';

/**
 * Top-level orchestrator for the AI Niche Finder experience.
 * Phases: landing → assessment → processing → booking.
 *
 * IMPORTANT: the user NEVER sees their assessment results. After the final
 * question the complete analysis + a full audit trail are stored for the ADMIN
 * only, and the user is taken straight to the "Book Your FREE 1-to-1 Strategy
 * Call" page — the analysis is explained live during that consultation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoginRequiredModal } from '@/components/auth/LoginRequiredModal';
import { analyze, asArray, visibleQuestions } from '@/lib/nicheAI/engine';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  clearAttempt,
  getSettings,
  loadAttempt,
  loadCategories,
  loadEnabledQuestions,
  logAnalytics,
  saveAttempt,
  saveResult,
} from '@/lib/nicheAI/firestore';
import {
  ATTEMPT_STORAGE_KEY,
  DEFAULT_WEIGHTS,
  type AnalysisResult,
  type AnswerLog,
  type AnswerValue,
  type Answers,
  type NicheSession,
  type Question,
  type QuestionCategory,
  type ScoringWeights,
} from '@/lib/nicheAI/types';
import { Assessment } from './Assessment';
import { Booking } from './Booking';
import { NicheDiscovery } from './discovery/NicheDiscovery';
import { Processing } from './Processing';
import { ToastProvider } from './Toast';

type Phase = 'landing' | 'assessment' | 'processing' | 'booking' | 'error';
type Theme = 'light' | 'dark';

/** Human-readable labels for a question's answer (admin audit trail). */
function answerLabels(q: Question, answer: AnswerValue | undefined): string[] {
  if (answer === undefined || answer === null || answer === '') return [];
  if (q.options && (q.type === 'single' || q.type === 'multi' || q.type === 'multiSelect' || q.type === 'ranking')) {
    return asArray(answer).map((v) => q.options!.find((o) => o.value === v)?.label ?? v);
  }
  if (q.type === 'scale') return [String(answer)];
  if (q.type === 'tags') return asArray(answer);
  return [String(answer)];
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

/**
 * Store the COMPLETE assessment (audit trail + scoring/analysis) for the admin
 * via the existing /api/submit ingestion endpoint — so it appears in the Admin
 * panel and works even without Firebase. This data is ADMIN ONLY.
 */
async function storeForAdmin(res: AnalysisResult, session: NicheSession): Promise<void> {
  try {
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        formKey: 'niche-assessment',
        formLabel: 'AI Niche Assessment',
        uid: session.user.uid,
        name: session.user.name,
        email: session.user.email,
        sourceUrl: '/niche-finder',
        answers: {
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
          durationMs: session.durationMs,
          durationLabel: formatDuration(session.durationMs),
          responses: session.questionsShown.map((q) => ({
            question: q.title,
            category: q.categoryTitle,
            type: q.type,
            answer: q.answerLabels.length ? q.answerLabels.join(', ') : '—',
            answeredAt: q.answeredAt,
          })),
          // Scoring & analysis — ADMIN ONLY, never shown to the user.
          analysis: {
            topNiche: res.recommendations[0]?.title ?? null,
            headlineScore: res.headlineScore,
            headlineConfidence: res.headlineConfidence,
            summary: res.summary,
            recommendations: res.recommendations.map((r) => ({ niche: r.title, category: r.categoryName, score: r.nicheScore })),
            profile: res.profile,
          },
        },
      }),
    });
  } catch {
    /* non-blocking — the booking flow still proceeds */
  }
}

const FEATURES = ['10 intelligence dimensions', '24-point analysis', 'Top-5 ranked niches', '90-day action plan'];
const STEPS = [
  { icon: '📝', title: 'Answer', text: 'A smart, adaptive assessment across passion, skills, market & goals.' },
  { icon: '🧠', title: 'Analyse', text: 'The CoachX Intelligence Engine scores 24 niches for your unique profile.' },
  { icon: '🚀', title: 'Act', text: 'Get your best-fit niche, positioning, offers and a 90-day plan.' },
];

export function NicheFinderApp() {
  return (
    <ToastProvider>
      <NicheFinderInner />
    </ToastProvider>
  );
}

function NicheFinderInner() {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();

  const [theme, setTheme] = useState<Theme>('dark');
  const [phase, setPhase] = useState<Phase>('landing');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [authModal, setAuthModal] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Admin-only session tracking (start time + per-answer timestamps).
  const startedAtRef = useRef<string | null>(null);
  const answerTimesRef = useRef<Record<string, string>>({});

  // ---- Theme init (system pref, then remembered) ----
  useEffect(() => {
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('cx-theme')) as Theme | null;
    if (stored) setTheme(stored);
    else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) setTheme('light');
  }, []);
  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('cx-theme', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // ---- Load question config (Firestore → seed fallback) ----
  useEffect(() => {
    let active = true;
    (async () => {
      const [qs, cats, settings] = await Promise.all([loadEnabledQuestions(), loadCategories(), getSettings()]);
      if (!active) return;
      setQuestions(qs);
      setCategories(cats);
      setWeights(settings.weights ?? DEFAULT_WEIGHTS);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // ---- Restore saved progress on mount (localStorage, then Firestore) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ATTEMPT_STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { answers?: Answers; stepIndex?: number };
        if (s.answers && Object.keys(s.answers).length) {
          setAnswers(s.answers);
          setStepIndex(s.stepIndex ?? 0);
          setHasSaved(true);
        }
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    void loadAttempt(user.uid).then((a) => {
      if (a && Object.keys(a.answers).length) {
        setAnswers((prev) => (Object.keys(prev).length ? prev : a.answers));
        setStepIndex((prev) => (prev ? prev : a.stepIndex));
        setHasSaved(true);
      }
    });
  }, [user?.uid]);

  // ---- Autosave (local immediately, Firestore debounced) ----
  const persist = useCallback(
    (a: Answers, step: number) => {
      try {
        localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify({ answers: a, stepIndex: step }));
      } catch {
        /* ignore */
      }
      if (user?.uid) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => void saveAttempt(user.uid, a, step), 800);
      }
    },
    [user?.uid],
  );

  const onAnswer = (id: string, v: AnswerValue) => {
    answerTimesRef.current[id] = new Date().toISOString(); // admin audit trail
    setAnswers((prev) => {
      const next = { ...prev, [id]: v };
      if (phase === 'assessment') persist(next, stepIndex);
      return next;
    });
  };
  const onStep = (i: number) => {
    setStepIndex(i);
    persist(answers, i);
  };

  function start(fresh: boolean) {
    if (!isAuthenticated) {
      setAuthModal(true);
      return;
    }
    if (fresh) {
      setAnswers({});
      setStepIndex(0);
      answerTimesRef.current = {};
      try {
        localStorage.removeItem(ATTEMPT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    startedAtRef.current = new Date().toISOString(); // admin audit trail
    setPhase('assessment');
    void logAnalytics('assessment_started', user?.uid ?? null);
  }

  function complete() {
    setPhase('processing');
  }

  /**
   * When processing finishes: run the engine, capture the full audit trail, and
   * STORE everything for the admin — then take the user to the booking page.
   * The user is never shown any score, analysis or recommendation.
   */
  const finishProcessing = useCallback(() => {
    try {
      const res = analyze(questions, answers, { uid: user?.uid ?? null, offline: !isFirebaseConfigured, weights });
      if (!res.recommendations.length) throw new Error('Not enough signal to generate recommendations.');

      // Build the admin-only session / audit trail.
      const visible = visibleQuestions(questions, answers);
      const startedAt = startedAtRef.current ?? new Date().toISOString();
      const completedAt = new Date().toISOString();
      const durationMs = Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
      const questionsShown: AnswerLog[] = visible.map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type,
        categoryId: q.categoryId,
        categoryTitle: categories.find((c) => c.id === q.categoryId)?.title ?? q.categoryId,
        answer: answers[q.id] ?? null,
        answerLabels: answerLabels(q, answers[q.id]),
        answeredAt: answerTimesRef.current[q.id] ?? null,
      }));
      const session: NicheSession = {
        startedAt,
        completedAt,
        durationMs,
        status: 'completed',
        user: { uid: user?.uid ?? null, email: user?.email ?? null, name: user?.name ?? null },
        questionsShown,
      };
      res.session = session;

      // Persist the COMPLETE assessment for the admin (results + audit + scoring).
      void saveResult(res); // Firestore nicheResults (admin module) when configured
      void storeForAdmin(res, session); // file-backed admin submission (always works)

      // User sees the booking flow — never the results.
      setPhase('booking');
      try {
        localStorage.removeItem(ATTEMPT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      if (user?.uid) void clearAttempt(user.uid);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong while submitting your answers.');
      setPhase('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, answers, categories, user?.uid, weights]);

  function restart() {
    setAnswers({});
    setStepIndex(0);
    answerTimesRef.current = {};
    startedAtRef.current = null;
    setPhase('landing');
  }

  return (
    <div data-cx-theme={theme} data-testid="nf-root" className="cx-root">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/tools" className="cx-chip cx-focus">
            ← All tools
          </Link>
          <div className="flex items-center gap-2">
            {phase === 'assessment' || phase === 'processing' ? (
              <button onClick={() => setPhase('landing')} className="cx-btn cx-btn-ghost cx-focus !min-h-0 !py-1.5 text-xs">
                Exit
              </button>
            ) : null}
            <button
              onClick={toggleTheme}
              data-testid="nf-theme"
              className="cx-btn cx-btn-ghost cx-focus btn-fx-icon !min-h-0 !px-3 !py-1.5"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="btn-ico" aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-24">
            <div className="cx-spin h-10 w-10 rounded-full" style={{ border: '3px solid var(--cx-track)', borderTopColor: 'var(--cx-gold)' }} />
          </div>
        ) : phase === 'landing' ? (
          <Landing hasSaved={hasSaved} onStart={() => start(true)} onResume={() => start(false)} categories={categories} />
        ) : phase === 'error' ? (
          <div className="mx-auto max-w-lg text-center">
            <div className="cx-glass cx-fade-up p-10">
              <div className="text-5xl">😕</div>
              <h2 className="mt-4 text-xl font-extrabold" style={{ color: 'var(--cx-text)' }}>We couldn't submit your assessment</h2>
              <p className="cx-muted mt-2 text-sm">{errorMsg}</p>
              <div className="mt-6 flex justify-center gap-3">
                <button onClick={() => setPhase('processing')} className="cx-btn cx-btn-primary cx-focus">Try again</button>
                <button onClick={restart} className="cx-btn cx-btn-ghost cx-focus">Start over</button>
              </div>
            </div>
          </div>
        ) : phase === 'assessment' ? (
          <Assessment
            questions={questions}
            categories={categories}
            answers={answers}
            stepIndex={stepIndex}
            onAnswer={onAnswer}
            onStep={onStep}
            onComplete={complete}
            onExit={() => setPhase('landing')}
          />
        ) : phase === 'processing' ? (
          <Processing onDone={finishProcessing} />
        ) : phase === 'booking' ? (
          <Booking user={user ? { name: user.name, email: user.email } : null} />
        ) : null}
      </div>

      <LoginRequiredModal open={authModal} onCancel={() => setAuthModal(false)} next={pathname} />
    </div>
  );
}

function Landing({
  hasSaved,
  onStart,
  onResume,
  categories,
}: {
  hasSaved: boolean;
  onStart: () => void;
  onResume: () => void;
  categories: QuestionCategory[];
}) {
  return (
    <div className="cx-fade-up">
      {/* Hero + the full browse experience. Exploring the library is the landing
          page now — the assessment CTA rides inside the hero rather than being
          the only thing a first-time visitor can do. */}
      <NicheDiscovery
        mode="browse"
        header={
          <>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={onStart} data-testid="nf-start" className="cx-btn cx-btn-primary cx-focus btn-fx-ai text-base">
                🚀 Start free assessment
              </button>
              {hasSaved ? (
                <button onClick={onResume} data-testid="nf-resume" className="cx-btn cx-btn-gold cx-focus btn-fx-sweep text-base">
                  ↩ Resume where you left off
                </button>
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {FEATURES.map((f) => (
                <span key={f} className="cx-chip">
                  ✓ {f}
                </span>
              ))}
            </div>
          </>
        }
      />

      {/* How it works */}
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="cx-glass p-6 text-center">
            <div className="cx-float mx-auto text-4xl" style={{ animationDelay: `${i * 0.4}s` }}>
              {s.icon}
            </div>
            <h3 className="mt-3 font-extrabold" style={{ color: 'var(--cx-text)' }}>
              {i + 1}. {s.title}
            </h3>
            <p className="cx-muted mt-1 text-sm">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Categories preview */}
      <div className="mt-10 text-center">
        <p className="cx-muted mb-3 text-xs font-bold uppercase tracking-wider">Analysed across 10 dimensions</p>
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <span key={c.id} className="cx-chip">
              {c.icon} {c.title}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
