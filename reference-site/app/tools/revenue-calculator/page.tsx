import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Section } from '@/components/ui';
import { RevenueCalculator } from '@/components/RevenueCalculator';

export const metadata: Metadata = {
  title: 'Revenue Calculator',
  description: 'Model clients, pricing and conversion to project your monthly and yearly coaching revenue.',
};

export default function RevenueCalculatorPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_50%_0%,rgba(16,80,48,0.22),transparent_70%)]" />
        <Container className="relative py-14 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Original tool · free</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-h1 text-white sm:text-display">Coaching Revenue Calculator</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            See what predictable revenue could look like. Adjust your leads, conversion and pricing to model
            monthly and yearly income.
          </p>
        </Container>
      </section>

      <Section>
        <RevenueCalculator />
      </Section>

      <div className="border-t border-slate-200 bg-slate-50">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-sm text-slate-500 sm:flex-row">
          <span>This is an original planning tool — figures are estimates, not guarantees.</span>
          <Link href="/tools" className="font-semibold text-teal hover:underline">
            ← All tools
          </Link>
        </Container>
      </div>
    </>
  );
}
