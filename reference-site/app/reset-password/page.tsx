'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Section } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { PasswordField } from '@/components/PasswordField';
import { useAuth } from '@/components/auth/AuthProvider';
import { ActionButton } from '@/components/ActionButton';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-slate-600">This reset link is missing its token.</p>
        <Link href="/forgot-password" className="mt-3 inline-block font-semibold text-teal hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Could not reset password.');
      await refresh();
      router.push('/tools');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
      <PasswordField id="password" label="New password" value={password} onChange={setPassword} placeholder="At least 8 characters" autoComplete="new-password" />
      <PasswordField id="confirm" label="Confirm new password" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" autoComplete="new-password" />
      {error ? (
        <p className="rounded-card bg-teal/10 px-4 py-2 text-sm font-medium text-teal-dark" role="alert">
          {error}
        </p>
      ) : null}
      <ActionButton type="submit" loading={busy} variant="primary" className="w-full text-base" data-testid="reset-confirm-submit">
        {busy ? 'Updating…' : 'Set new password'}
      </ActionButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-md">
          <div className="rounded-xl2 border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex justify-center">
              <Logo height={34} />
            </div>
            <h1 className="mt-6 text-center text-2xl font-extrabold text-ink">Choose a new password</h1>
            <p className="mt-1 text-center text-sm text-slate-500">Enter a new password for your account.</p>
            <Suspense fallback={<div className="py-10 text-center text-slate-400">Loading…</div>}>
              <ResetForm />
            </Suspense>
            <p className="mt-5 text-center text-sm text-slate-500">
              <Link href="/login" className="font-semibold text-teal hover:underline">
                ← Back to log in
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
