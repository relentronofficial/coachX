import type { Metadata } from 'next';
import { Section, SectionHeading, Button, Badge } from '@/components/ui';
import { CTA } from '@/components/sections';
import { events } from '@/lib/site';

export const metadata: Metadata = { title: 'Events' };

export default function EventsPage() {
  return (
    <>
      <Section>
        <SectionHeading eyebrow="Events" title="Live events & retreats" lead="Placeholder event listings." />
        <div className="grid gap-6 md:grid-cols-3">
          {events.map((e) => (
            <div key={e.slug} className="card flex flex-col">
              <div className="flex items-center gap-2">
                <Badge>{e.format}</Badge>
                <span className="text-xs font-semibold text-slate-400">{e.when}</span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-ink">{e.name}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-500">{e.blurb}</p>
              <div className="mt-5">
                <Button href="#" variant="secondary" className="w-full">Learn more</Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <CTA />
    </>
  );
}
