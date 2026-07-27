import Image from 'next/image';
import type { Metadata } from 'next';
import { Section, SectionHeading, Button, Eyebrow } from '@/components/ui';
import { StatBar, CTA } from '@/components/sections';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>About the founder</Eyebrow>
            <h1 className="text-h1">Meet Sakthivel Pannerselvam</h1>
            <p className="mt-5 text-lg text-slate-500">
              Founder of CoachX and Tamil Business Tribe. Placeholder founder story — describe the mission,
              the coaches you serve, and why the community exists. Replace this copy with your own.
            </p>
            <div className="mt-8 flex gap-3">
              <Button href="/join" variant="amber">Join the community</Button>
              <Button href="/programs" variant="secondary">See programs</Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-fit">
              <Image
                src="/brand/founder.png"
                alt="Sakthivel Pannerselvam, Founder of CoachX"
                width={408}
                height={612}
                priority
                className="h-[440px] w-auto object-contain drop-shadow-xl sm:h-[540px]"
              />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-white px-5 py-2 text-center shadow-soft">
                <p className="text-sm font-extrabold text-ink">Sakthivel Pannerselvam</p>
                <p className="text-xs text-slate-500">Founder · CoachX</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
      <StatBar />
      <Section>
        <SectionHeading eyebrow="Values" title="What we stand for" />
        <div className="grid gap-6 md:grid-cols-3">
          {['Clarity over hype', 'Community over competition', 'Consistency over intensity'].map((v) => (
            <div key={v} className="card">
              <h3 className="text-lg font-bold text-ink">{v}</h3>
              <p className="mt-2 text-sm text-slate-500">Placeholder description of this value and how it shows up day to day.</p>
            </div>
          ))}
        </div>
      </Section>
      <CTA />
    </>
  );
}
