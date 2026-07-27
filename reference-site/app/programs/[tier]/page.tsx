import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section, SectionHeading, Button, Badge } from '@/components/ui';
import { ProgramCard, CTA } from '@/components/sections';
import { FAQ } from '@/components/FAQ';
import { programs } from '@/lib/site';

export function generateStaticParams() {
  return programs.map((p) => ({ tier: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tier: string }> }): Promise<Metadata> {
  const { tier } = await params;
  const program = programs.find((p) => p.slug === tier);
  return { title: program ? `${program.name} membership` : 'Program' };
}

export default async function TierPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = await params;
  const program = programs.find((p) => p.slug === tier);
  if (!program) notFound();
  const others = programs.filter((p) => p.slug !== program.slug);

  return (
    <>
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          {program.featured ? <Badge>Most popular</Badge> : null}
          <h1 className="mt-3 text-h1">{program.name} membership</h1>
          <p className="mt-4 text-lg text-slate-500">{program.summary}</p>
          <div className="mt-6 flex items-end justify-center gap-1">
            <span className="text-5xl font-extrabold text-ink">{program.price}</span>
            <span className="pb-2 text-slate-400">{program.cadence}</span>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/join" variant="amber">Get {program.name}</Button>
            <Button href="/programs" variant="secondary">Compare plans</Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <h2 className="text-lg font-bold text-ink">What's included</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {program.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 rounded-card border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <span className="mt-0.5 text-teal">✓</span> {perk}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionHeading eyebrow="Other tiers" title="Compare options" align="center" />
        <div className="grid items-start gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
          {others.map((p) => (
            <ProgramCard key={p.slug} program={p} />
          ))}
        </div>
      </Section>

      <Section>
        <FAQ />
      </Section>
      <CTA />
    </>
  );
}
