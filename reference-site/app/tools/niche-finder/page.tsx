import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section } from '@/components/ui';
import { NicheFinder } from '@/components/NicheFinder';
import { getSession } from '@/lib/auth/session';
import { RequireAuthGate } from '@/components/auth/RequireAuthGate';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Niche Finder',
  description: 'Answer a few quick questions and get your best-fit coaching niches, ranked with reasons.',
};

export default async function NicheFinderPage() {
  const session = await getSession();
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_0%,rgba(208,160,48,0.24),transparent_70%)]" />
        <Container className="relative py-14 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Member tool</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-h1 text-white sm:text-display">Find your perfect coaching niche</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Not sure which niche is right for you? Answer a few questions and we'll rank your best-fit niches —
            with the reasons behind each match.
          </p>
        </Container>
      </section>

      {/* Wizard (server-gated) */}
      <Section>
        {session ? <NicheFinder /> : <RequireAuthGate toolName="Niche Finder" />}
      </Section>

      <div className="border-t border-slate-200 bg-slate-50">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-sm text-slate-500 sm:flex-row">
          <span>Your answers are scored on the fly and never stored.</span>
          <Link href="/tools" className="font-semibold text-teal hover:underline">
            ← All tools
          </Link>
        </Container>
      </div>
    </>
  );
}
