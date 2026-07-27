'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Section } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { PasswordField } from '@/components/PasswordField';
import { ActionButton } from '@/components/ActionButton';
import { useAuth } from '@/components/auth/AuthProvider';
import { firebaseAuthMessage } from '@/lib/firebaseErrors';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('redirect') || params.get('next') || '/tools';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password); // Firebase Authentication
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(firebaseAuthMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl2 border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex justify-center">
          <Logo height={34} />
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-ink">Log in to CoachX</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Access your tools and save your progress.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold text-slate-600">
              Email
            </label>
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
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            labelRight={
              <Link href="/forgot-password" className="text-xs font-semibold text-teal hover:underline" data-testid="forgot-link">
                Forgot password?
              </Link>
            }
          />

          {error ? (
            <p className="rounded-card bg-teal/10 px-4 py-2 text-sm font-medium text-teal-dark" role="alert">
              {error}
            </p>
          ) : null}

          <ActionButton type="submit" loading={busy} variant="primary" className="w-full text-base" data-testid="login-submit">
            {busy ? 'Signing in…' : 'Log in'}
          </ActionButton>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New here?{' '}
          <Link
            href={next && next !== '/tools' ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
            className="font-semibold text-teal hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link href="/tools" className="font-semibold text-teal hover:underline">
          ← Back to tools
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Section>
      <Container>
        <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </Container>
    </Section>
  );
}
