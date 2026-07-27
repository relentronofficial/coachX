'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Section } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { PasswordField } from '@/components/PasswordField';
import { ActionButton } from '@/components/ActionButton';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { useAuth } from '@/components/auth/AuthProvider';
import { firebaseAuthMessage } from '@/lib/firebaseErrors';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('redirect') || params.get('next') || '/tools';
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setBusy(true);
    try {
      // Firebase account + Firestore profile (users/{uid}), created together.
      await register({ fullName: name, email, password, phone });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(firebaseAuthMessage(err));
      setBusy(false);
    }
  }

  const loginHref = next && next !== '/tools' ? `/login?redirect=${encodeURIComponent(next)}` : '/login';

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl2 border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex justify-center">
          <Logo height={34} />
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-ink">Create your CoachX account</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Free to join — unlock the tools and save your progress.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-11 w-full rounded-pill border border-slate-300 px-5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
            />
          </div>
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
          <div>
            <label htmlFor="phone" className="mb-1 block text-xs font-semibold text-slate-600">Phone (optional)</label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 90000 00000"
              className="h-11 w-full rounded-pill border border-slate-300 px-5 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
            />
          </div>
          <div>
            <PasswordField id="password" label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" autoComplete="new-password" />
            <div className="mt-2">
              <PasswordStrengthMeter password={password} />
            </div>
          </div>
          <PasswordField id="confirm" label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" autoComplete="new-password" />

          {error ? (
            <p className="rounded-card bg-teal/10 px-4 py-2 text-sm font-medium text-teal-dark" role="alert">
              {error}
            </p>
          ) : null}

          <ActionButton type="submit" loading={busy} variant="primary" className="w-full text-base" data-testid="signup-submit">
            {busy ? 'Creating account…' : 'Create account'}
          </ActionButton>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href={loginHref} className="font-semibold text-teal hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Section>
      <Container>
        <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading…</div>}>
          <SignupForm />
        </Suspense>
      </Container>
    </Section>
  );
}
