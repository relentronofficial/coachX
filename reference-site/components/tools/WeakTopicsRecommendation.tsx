import Link from 'next/link';
import { clarityAdvice } from '@/lib/tools/engine';
import { toBookingQuery } from '@/lib/tools/booking';
import type { ResultData } from '@/lib/tools/types';

/**
 * Personalised low-clarity nudge shown under any assessment result.
 *
 * Shared by all six Codex tools through `ResultView`, so there is one
 * implementation and one place to change the copy. Whether it renders is
 * decided entirely by the pure `clarityAdvice()` in the tools engine — this
 * component only draws that answer and hands it to the booking flow.
 *
 * Exactly ONE card renders no matter how many areas are weak.
 */

const BENEFITS = ['Personalized guidance', 'Clear action plan', 'Expert recommendations', 'Practical next steps'];

const HEADING_ID = 'weak-topics-recommendation-title';

export function WeakTopicsRecommendation({
  data,
  toolName,
  toolSlug,
}: {
  data: ResultData;
  toolName?: string;
  toolSlug?: string;
}) {
  const advice = clarityAdvice(data);
  if (!advice) return null; // every area is at or above the threshold

  const critical = advice.severity === 'critical';
  // The joint-lowest areas get a badge; ties are all marked, never just one.
  const weakestLabels = new Set(advice.weakest.map((a) => a.label));

  // Reuses the existing strategy-call booking flow — the query only carries
  // context, it does not create a booking.
  const query = toBookingQuery({
    assessment: toolName ?? 'Assessment',
    assessmentId: toolSlug,
    overall: advice.overall,
    weakTopics: advice.lowAreas,
  });

  return (
    <section
      aria-labelledby={HEADING_ID}
      data-testid="weak-topics-recommendation"
      data-variant={advice.variant}
      className="relative mt-8 overflow-hidden rounded-xl2 bg-gradient-to-br from-ink via-ink-800 to-teal-dark p-6 text-left text-white shadow-glow-lg sm:p-8"
    >
      {/* Decorative gold wash — matches the tool page hero treatment. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_0%,rgba(208,160,48,0.28),transparent_70%)]"
      />

      <div className="relative">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-amber/15 text-2xl ring-1 ring-amber/30"
          >
            {critical ? '⚠' : '🎯'}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber">
              {critical ? 'High priority' : 'Recommended next step'}
            </p>
            {/* `text-white` is required: the base layer forces `text-ink` on every h3. */}
            <h3 id={HEADING_ID} className="mt-1.5 text-xl font-extrabold text-white sm:text-2xl">
              Your Biggest Growth Opportunity
            </h3>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
          Based on your assessment, these are the areas where you need the most clarity. During the FREE 1-to-1
          Strategy Call, our expert will focus specifically on these topics and provide a personalized action plan.
        </p>

        <h4 className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
          {advice.lowAreas.length > 1 ? 'Your weak areas' : 'Your weak area'}
        </h4>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="weak-topics-list">
          {advice.lowAreas.map((area) => {
            const isWeakest = weakestLabels.has(area.label);
            return (
              <li
                key={area.label}
                className="flex items-center gap-2.5 rounded-card bg-white/10 px-3.5 py-2.5 text-sm ring-1 ring-white/15"
              >
                <span aria-hidden="true">📌</span>
                <span className="min-w-0 flex-1 font-semibold text-white">{area.label}</span>
                {isWeakest ? (
                  <span className="hidden rounded-pill bg-amber/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber sm:inline">
                    Biggest gap
                  </span>
                ) : null}
                <span className={`font-bold tabular-nums ${isWeakest ? 'text-amber' : 'text-slate-300'}`}>
                  {area.score}%
                </span>
              </li>
            );
          })}
        </ul>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <span aria-hidden="true" className="text-amber">
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <Link
          href={`/book-strategy-call?${query}`}
          data-testid="weak-topics-cta"
          className="btn-amber btn-fx-book mt-7 w-full text-base sm:w-auto focus-visible:ring-offset-ink"
        >
          <span className="btn-ico" aria-hidden="true">📞</span>
          <span className="btn-label">Book FREE 1-to-1 Strategy Call</span>
        </Link>
      </div>
    </section>
  );
}
