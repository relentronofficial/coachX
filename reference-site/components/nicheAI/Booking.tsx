'use client';

/**
 * Post-assessment "Book Your FREE 1-to-1 Strategy Call" flow.
 *
 * This REPLACES the user-facing result page: no score, analysis, or
 * recommendation is ever shown here. The complete analysis is stored for the
 * admin only and is explained to the user during the free consultation.
 *
 * Booking requests are stored via the existing /api/submit ingestion endpoint,
 * so they appear in the Admin panel with zero new infrastructure.
 */

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { toSubmissionAnswers, type BookingContext } from '@/lib/tools/booking';

type Phase = 'intro' | 'form' | 'confirmed';

export function Booking({
  user,
  source = 'AI Niche Finder',
  context = null,
  skipIntro = false,
}: {
  user: { name?: string; email?: string } | null;
  /** Labels the submission in the admin panel — which assessment sent them here. */
  source?: string;
  /**
   * Assessment context from a result page: which topics scored weakest and the
   * overall score. Shown to the user and stored with the booking so the coach
   * can prepare. `null` for the Niche Finder, which books off its own flow.
   */
  context?: BookingContext | null;
  /**
   * Open straight on the form, without the "Thank you for completing your
   * assessment" intro. The Niche Finder relies on that intro — it *is* its
   * result page — so this stays off by default.
   */
  skipIntro?: boolean;
}) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>(skipIntro ? 'form' : 'intro');
  const [form, setForm] = useState({
    fullName: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    date: '',
    time: '',
    message: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.date || !form.time) {
      setError('Please fill in your name, email, phone, and a preferred date & time.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          formKey: 'strategy-call',
          formLabel: 'Free Strategy Call',
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          answers: {
            preferredDate: form.date,
            preferredTime: form.time,
            message: form.message,
            source,
            // Assessment / weak-topic context, so the coach can prepare.
            ...(context ? toSubmissionAnswers(context) : {}),
          },
          sourceUrl: pathname,
        }),
      });
      if (!res.ok) throw new Error();
      setPhase('confirmed');
    } catch {
      setError('Something went wrong sending your request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ---- Confirmation ----
  if (phase === 'confirmed') {
    return (
      <div className="mx-auto max-w-lg text-center cx-fade-up" data-testid="nf-booking">
        <div className="cx-glass p-10" data-testid="nf-booking-confirm">
          <div className="cx-float mx-auto text-5xl">📅</div>
          <h1 className="mt-5 text-2xl font-extrabold" style={{ color: 'var(--cx-text)' }}>
            Your call request is confirmed
          </h1>
          <p className="cx-muted mx-auto mt-3 max-w-md text-sm">
            Thanks, {form.fullName.split(' ')[0] || 'there'}! We've received your booking for{' '}
            <strong style={{ color: 'var(--cx-text)' }}>{form.date}</strong> at{' '}
            <strong style={{ color: 'var(--cx-text)' }}>{form.time}</strong>. Our team will confirm your
            FREE 1-to-1 strategy call by email at <strong style={{ color: 'var(--cx-text)' }}>{form.email}</strong> and
            walk you through your complete assessment analysis live.
          </p>
          <p className="cx-muted mt-4 text-xs">You can close this page — we'll be in touch shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl cx-fade-up" data-testid="nf-booking">
      {skipIntro ? (
        /* Arrived from a result page — the recommendation already made the
           case, so lead with what the call will cover instead of a thank-you. */
        <div className="cx-glass p-6 sm:p-8" data-testid="nf-booking-focus">
          <h1 className="text-2xl font-extrabold sm:text-3xl cx-brandtext">Book your FREE 1-to-1 strategy call</h1>
          {context ? (
            <>
              <p className="cx-muted mt-3 text-sm">
                Based on your <strong style={{ color: 'var(--cx-text)' }}>{context.assessment}</strong> result
                {typeof context.overall === 'number' ? (
                  <>
                    {' '}
                    (overall <strong style={{ color: 'var(--cx-text)' }}>{context.overall}%</strong>)
                  </>
                ) : null}
                , your strategist will focus on:
              </p>
              {context.weakTopics.length ? (
                <ul className="mt-3 flex flex-wrap gap-2" data-testid="nf-booking-topics">
                  {context.weakTopics.map((t) => (
                    <li
                      key={t.label}
                      className="inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs font-semibold"
                      style={{ background: 'var(--cx-surface)', border: '1px solid var(--cx-glass-border)', color: 'var(--cx-text)' }}
                    >
                      <span aria-hidden="true">📌</span>
                      {t.label}
                      <span style={{ color: 'var(--cx-gold)' }}>{t.score}%</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="cx-muted mt-3 text-sm">
              Tell us when suits you and a CoachX strategist will walk you through a personalised action plan.
            </p>
          )}
        </div>
      ) : (
        /* Success message + explanation (Niche Finder — this IS its result page) */
        <div className="cx-glass p-8 text-center sm:p-10">
          <div className="cx-float mx-auto text-5xl">✅</div>
          <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl cx-brandtext">
            Thank you for completing your assessment.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: 'var(--cx-text)' }}>
            Your assessment has been <strong>successfully received</strong>. There's nothing more you need to do right now.
          </p>
          <p className="cx-muted mx-auto mt-3 max-w-md text-sm">
            Your complete, personalised analysis will be explained to you step-by-step during a{' '}
            <strong style={{ color: 'var(--cx-text)' }}>FREE 1-to-1 strategy call</strong> with a CoachX strategist —
            so you get real clarity and a plan, not just a page of numbers.
          </p>

          {phase === 'intro' ? (
            <button onClick={() => setPhase('form')} data-testid="nf-book-cta" className="cx-btn cx-btn-gold cx-focus btn-fx-book mt-6 text-base">
              📞 Book Your FREE Call
            </button>
          ) : null}
        </div>
      )}

      {/* Booking form */}
      {phase === 'form' ? (
        <form onSubmit={submit} data-testid="nf-booking-form" className="cx-glass mt-4 space-y-4 p-6 sm:p-8">
          <h2 className="text-lg font-extrabold" style={{ color: 'var(--cx-text)' }}>Book your free strategy call</h2>

          <Field label="Full name" required>
            <input value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} data-testid="bk-name" className="cx-input" autoComplete="name" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" required>
              <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} data-testid="bk-email" className="cx-input" autoComplete="email" />
            </Field>
            <Field label="Phone number" required>
              <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} data-testid="bk-phone" className="cx-input" autoComplete="tel" placeholder="+91 90000 00000" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred date" required>
              <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} data-testid="bk-date" className="cx-input" />
            </Field>
            <Field label="Preferred time" required>
              <input type="time" value={form.time} onChange={(e) => set({ time: e.target.value })} data-testid="bk-time" className="cx-input" />
            </Field>
          </div>
          <Field label="Message (optional)">
            <textarea value={form.message} onChange={(e) => set({ message: e.target.value })} data-testid="bk-message" rows={3} className="cx-input" placeholder="Anything you'd like us to know before the call?" />
          </Field>

          {error ? <p className="text-sm font-semibold" style={{ color: '#e0602b' }} role="alert">{error}</p> : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy || undefined}
              data-loading={busy ? 'true' : undefined}
              data-testid="nf-booking-submit"
              className="cx-btn cx-btn-primary cx-focus btn-fx-book"
            >
              {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
              <span className="btn-label">{busy ? 'Sending…' : 'Confirm my booking'}</span>
            </button>
            {/* No intro to go back to when the form opened directly. */}
            {skipIntro ? null : (
              <button type="button" onClick={() => setPhase('intro')} className="cx-btn cx-btn-ghost cx-focus">
                Back
              </button>
            )}
          </div>
        </form>
      ) : null}

      <style jsx>{`
        .cx-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--cx-glass-border);
          background: var(--cx-surface);
          color: var(--cx-text);
          padding: 0.6rem 0.85rem;
          font-size: 0.9rem;
        }
        .cx-input:focus {
          outline: 2px solid var(--cx-gold);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="cx-muted text-xs font-semibold">
        {label} {required ? <span style={{ color: 'var(--cx-gold)' }}>*</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
