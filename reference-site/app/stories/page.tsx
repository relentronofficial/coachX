import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Section, SectionHeading, Badge } from '@/components/ui';
import { CTA } from '@/components/sections';
import { Stagger } from '@/components/motion/Reveal';
import { stories, img } from '@/lib/site';

export const metadata: Metadata = { title: 'Stories' };

export default function StoriesPage() {
  return (
    <>
      <Section>
        <SectionHeading eyebrow="Stories" title="Member success stories" lead="Fictional case studies used to demonstrate the card grid." />
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" itemClassName="h-full" step={80}>
          {stories.map((s) => (
            <Link
              key={s.slug}
              href={`/stories/${s.slug}`}
              className="card card-i group flex h-full flex-col overflow-hidden p-0"
            >
              <div className="fx-frame">
                <Image
                  src={img(s.slug, 800, 500)}
                  alt=""
                  width={800}
                  height={500}
                  className="fx-media aspect-[8/5] w-full object-cover"
                />
              </div>
              <div className="p-5">
                <Badge>{s.role}</Badge>
                <h3 className="mt-3 text-lg font-bold text-ink">{s.name}</h3>
                <p className="text-sm text-slate-500">{s.city}</p>
                <p className="mt-2 text-lg font-extrabold text-teal">{s.result}</p>
                {/* Only render words the member actually said. */}
                {s.quote ? <p className="mt-2 text-sm text-slate-500">“{s.quote}”</p> : null}
              </div>
            </Link>
          ))}
        </Stagger>
      </Section>
      <CTA />
    </>
  );
}
