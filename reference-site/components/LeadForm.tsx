'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ActionButton } from '@/components/ActionButton';

type Status = 'idle' | 'submitting' | 'done' | 'error';

/**
 * Registration / lead-capture form. NO payment is taken — it posts to the
 * unified /api/submit endpoint, which stores the submission (auto-registering
 * the form in the Admin panel) and returns a reference id.
 */
export function LeadForm({
  cta = 'Reserve your spot',
  note,
  source = 'lead-form',
  formKey,
  formLabel,
}: {
  cta?: string;
  note?: string;
  source?: string;
  formKey?: string;
  formLabel?: string;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [ref, setRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          formKey: formKey ?? source,
          formLabel,
          // Auto-attached when the visitor is authenticated.
          uid: user?.uid ?? null,
          name: fd.get('lf-name') || user?.name || null,
          email: fd.get('lf-email') || user?.email || null,
          phone: fd.get('lf-phone'),
          sourceUrl: typeof window !== 'undefined' ? window.location.pathname : source,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `Something went wrong (${res.status}).`);
      setRef(data.id ? 'CX-' + data.id.replace(/-/g, '').slice(0, 6).toUpperCase() : null);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-card border border-teal/30 bg-teal/5 p-6 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-pill bg-teal text-xl text-white">✓</div>
        <p className="mt-3 text-lg font-bold text-ink">You're on the list</p>
        <p className="mt-1 text-sm text-slate-500">
          Your spot is reserved — no payment needed yet. We'll email you the details.
        </p>
        {ref ? (
          <p className="mt-3 inline-block rounded-pill bg-white px-3 py-1 text-xs font-semibold text-ink shadow-soft">
            Reference: {ref}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="lf-name" label="Full name" type="text" placeholder="Your name" autoComplete="name" required />
        <Field id="lf-email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" required />
      </div>
      <Field id="lf-phone" label="Phone (optional)" type="tel" placeholder="+91 90000 00000" autoComplete="tel" />

      {status === 'error' ? (
        <p className="rounded-card bg-teal/10 px-4 py-2 text-sm font-medium text-teal-dark" role="alert">
          {error}
        </p>
      ) : null}

      <ActionButton type="submit" loading={status === 'submitting'} variant="amber" className="mt-1 w-full text-base">
        {status === 'submitting' ? 'Reserving…' : cta}
      </ActionButton>
      <p className="text-center text-xs text-slate-400">
        {note ?? 'No payment required — you’re reserving your spot. We’ll email the details.'}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-600">
        {label} {required ? <span className="text-teal">*</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="h-11 w-full rounded-pill border border-slate-300 bg-white px-5 text-sm text-ink placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
    </div>
  );
}
