import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section, SectionHeading, Button, Badge } from '@/components/ui';
import { ProgramCard, CTA } from '@/components/sections';
import { Stagger } from '@/components/motion/Reveal';
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
          {/* No price or cadence here by design — the public site is value-led
              and investment is discussed on the call. `program.price` stays on
              the model and editable in Admin → Programs; it is never rendered
              to a visitor. */}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/join" variant="amber" fx="book">Reserve your spot</Button>
            <Button href="/programs" variant="secondary">Compare options</Button>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <h2 className="text-lg font-bold text-ink">What you walk away with</h2>
          <Stagger className="mt-4 grid gap-3 sm:grid-cols-2" itemClassName="h-full" step={60}>
            {program.perks.map((perk) => (
              <div
                key={perk}
                className="card-i flex h-full items-start gap-2 rounded-card border border-slate-200 bg-white p-4 text-sm text-slate-600"
              >
                <span className="mt-0.5 text-teal">✓</span> {perk}
              </div>
            ))}
          </Stagger>
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionHeading eyebrow="Other paths" title="Compare options" align="center" />
        <Stagger
          className="grid items-stretch gap-5 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl"
          itemClassName="h-full"
          step={90}
        >
          {others.map((p) => (
            <ProgramCard key={p.slug} program={p} />
          ))}
        </Stagger>
      </Section>

      <Section>
        <FAQ />
      </Section>
      <CTA />
    </>
  );
}
