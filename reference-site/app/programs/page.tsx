import type { Metadata } from 'next';
import { ProgramCards, CTA } from '@/components/sections';
import { Section, Eyebrow } from '@/components/ui';
import { Reveal } from '@/components/motion/Reveal';
import { FAQ } from '@/components/FAQ';

export const metadata: Metadata = { title: 'Programs' };

export default function ProgramsPage() {
  return (
    <>
      {/* Compact page hero. This carries the page's only <h1> — the grid below
          runs with `showHeading={false}` so the two don't compete. */}
      <Section density="tight" className="surface-tint">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Programs</Eyebrow>
          <h1 className="text-h1">Support that matches where you are</h1>
          <p className="mt-3 text-lg text-slate-500">
            Same system in every path — what changes is how much of it we build with you.
          </p>
        </Reveal>
      </Section>
      <ProgramCards showHeading={false} />
      <Section className="bg-slate-50">
        <FAQ />
      </Section>
      <CTA />
    </>
  );
}
