import Link from 'next/link';
import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/ui';
import { CTA } from '@/components/sections';
import { guides } from '@/lib/site';

export const metadata: Metadata = { title: 'Guides' };

export default function GuidesPage() {
  return (
    <>
      <Section>
        <SectionHeading eyebrow="Guides" title="Learn the fundamentals" lead="Short educational articles. Placeholder excerpts only." />
        <div className="grid gap-6 md:grid-cols-2">
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card transition-transform hover:-translate-y-1">
              <p className="text-xs font-semibold text-teal">{g.minutes} min read</p>
              <h3 className="mt-2 text-xl font-bold text-ink">{g.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{g.excerpt}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-ink">Read guide →</span>
            </Link>
          ))}
        </div>
      </Section>
      <CTA />
    </>
  );
}
