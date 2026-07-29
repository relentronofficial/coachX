import Link from 'next/link';
import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/ui';
import { CTA } from '@/components/sections';
import { Stagger } from '@/components/motion/Reveal';
import { guides } from '@/lib/site';

export const metadata: Metadata = { title: 'Guides' };

export default function GuidesPage() {
  return (
    <>
      <Section>
        <SectionHeading eyebrow="Guides" title="Learn the fundamentals" lead="Short educational articles. Placeholder excerpts only." />
        <Stagger className="grid gap-5 md:grid-cols-2" itemClassName="h-full" step={80}>
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="card card-i group flex h-full flex-col">
              <p className="text-xs font-semibold text-teal">{g.minutes} min read</p>
              <h3 className="mt-2 text-xl font-bold text-ink">{g.title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-500">{g.excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                Read guide <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </Stagger>
      </Section>
      <CTA />
    </>
  );
}
