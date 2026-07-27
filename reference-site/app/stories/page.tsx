import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Section, SectionHeading, Badge } from '@/components/ui';
import { CTA } from '@/components/sections';
import { stories, img } from '@/lib/site';

export const metadata: Metadata = { title: 'Stories' };

export default function StoriesPage() {
  return (
    <>
      <Section>
        <SectionHeading eyebrow="Stories" title="Member success stories" lead="Fictional case studies used to demonstrate the card grid." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <Link key={s.slug} href={`/stories/${s.slug}`} className="card group overflow-hidden p-0 transition-transform hover:-translate-y-1">
              <Image src={img(s.slug, 800, 500)} alt="" width={800} height={500} className="aspect-[8/5] w-full object-cover" />
              <div className="p-6">
                <Badge>{s.role}</Badge>
                <h3 className="mt-3 text-lg font-bold text-ink">{s.name}</h3>
                <p className="mt-1 text-sm font-semibold text-teal">{s.result}</p>
                <p className="mt-2 text-sm text-slate-500">“{s.quote}”</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>
      <CTA />
    </>
  );
}
