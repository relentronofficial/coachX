'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ActionButton } from '@/components/ActionButton';

type Status = 'idle' | 'submitting' | 'done' | 'error';

/**
 * Newsletter opt-in. Posts to /api/submit (formKey: newsletter). No payment.
 * Swap the endpoint for your email provider when you go live.
 */
export function Newsletter() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          formKey: 'newsletter',
          formLabel: 'Newsletter Signup',
          uid: user?.uid ?? null,
          name: user?.name ?? null,
          email: email || user?.email || null,
          sourceUrl: typeof window !== 'undefined' ? window.location.pathname : '/',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Please try again.');
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setStatus('error');
    }
  }

  return (
    <div className="rounded-xl2 bg-ink px-6 py-10 text-white shadow-glow-lg sm:px-12">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-amber">Stay in the loop</p>
          <h3 className="mt-2 text-h3 text-white">Get the weekly playbook</h3>
          <p className="mt-2 max-w-md text-slate-300">
            Practical tips for growing your coaching business — one short email a week.
          </p>
        </div>
        {status === 'done' ? (
          <div className="rounded-card bg-white/10 p-5 text-center">
            <p className="font-bold text-white">You’re subscribed ✓</p>
            <p className="mt-1 text-sm text-slate-300">Check your inbox to confirm.</p>
          </div>
        ) : (
          <form className="flex w-full flex-col gap-3 sm:flex-row" onSubmit={onSubmit} noValidate>
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 w-full rounded-pill border border-white/20 bg-white/10 px-5 text-white placeholder:text-slate-400 focus:border-teal focus:outline-none"
            />
            <ActionButton type="submit" loading={status === 'submitting'} variant="amber" className="whitespace-nowrap">
              {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
            </ActionButton>
          </form>
        )}
      </div>
      {status === 'error' ? <p className="mt-3 text-sm text-amber">{error}</p> : null}
    </div>
  );
}
