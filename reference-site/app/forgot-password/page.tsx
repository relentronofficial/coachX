'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container, Section } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/components/auth/AuthProvider';
import { firebaseAuthMessage } from '@/lib/firebaseErrors';
import { ActionButton } from '@/components/ActionButton';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Firebase sends the password-reset email.
      await forgotPassword(email);
      setMessage('If an account exists for that email, a password reset link has been sent.');
    } catch (err) {
      // Don't reveal whether the account exists for most errors.
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/invalid-email') setError('Enter a valid email address.');
      else if (code === 'auth/user-not-found') setMessage('If an account exists for that email, a password reset link has been sent.');
      else setError(firebaseAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-md">
          <div className="rounded-xl2 border border-slate-200 bg-white p-8 shadow-soft">
            <div className="flex justify-center">
              <Logo height={34} />
            </div>
            <h1 className="mt-6 text-center text-2xl font-extrabold text-ink">Reset your password</h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              Enter your email and we'll send you a link to set a new password.
            </p>

            {message ? (
              <div className="mt-6 rounded-card border border-teal/30 bg-teal/5 p-4 text-center">
                <p className="text-sm font-medium text-ink">{message}</p>
                {devUrl ? (
                  <p className="mt-3 break-all text-xs text-slate-500">
                    Dev mode — no email service. Use this link:
                    <br />
                    <Link href={devUrl.replace(/^https?:\/\/[^/]+/, '')} className="font-semibold text-teal hover:underline" data-testid="dev-reset-link">
                      Reset your password →
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : (
              <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-pill border border-slate-300 px-5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
                  />
                </div>
                {error ? (
                  <p className="rounded-card bg-teal/10 px-4 py-2 text-sm font-medium text-teal-dark" role="alert">
                    {error}
                  </p>
                ) : null}
                <ActionButton type="submit" loading={busy} variant="primary" className="w-full text-base" data-testid="reset-request-submit">
                  {busy ? 'Sending…' : 'Send reset link'}
                </ActionButton>
              </form>
            )}

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
