import type { Metadata } from 'next';
import { ProgramCards, CTA } from '@/components/sections';
import { Section, SectionHeading } from '@/components/ui';
import { FAQ } from '@/components/FAQ';

export const metadata: Metadata = { title: 'Programs' };

export default function ProgramsPage() {
  return (
    <>
      <Section className="pb-0">
        <SectionHeading
          eyebrow="Programs"
          title="Membership tiers"
          lead="Choose the level that fits where you are. Placeholder pricing and perks."
        />
      </Section>
      <ProgramCards />
      <Section className="bg-slate-50">
        <FAQ />
      </Section>
      <CTA />
    </>
  );
}
