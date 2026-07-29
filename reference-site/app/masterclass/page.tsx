import type { Metadata } from 'next';
import { Container, Section, Badge, Button } from '@/components/ui';
import { LeadForm } from '@/components/LeadForm';
import { StatBar } from '@/components/sections';
import { FAQ } from '@/components/FAQ';

export const metadata: Metadata = { title: 'Free Masterclass' };

const agenda = [
  'Attract high-quality leads with zero-rupee marketing',
  'Convert leads into paying clients with proven scripts',
  'Build a predictable, repeatable revenue system',
  'Automate and scale without burnout',
];

export default function MasterclassPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(208,160,48,0.24),transparent_70%)]" />
        <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <Badge>◆ 3-day live workshop</Badge>
            <h1 className="mt-5 text-h1 text-white sm:text-display">Scale your coaching business in 3 days</h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Three live Zoom sessions to install a predictable lead-to-revenue system. Reserve your spot below —
              the form is a demo and collects nothing until you wire it up.
            </p>
            <ul className="mt-8 space-y-3">
              {agenda.map((a) => (
                <li key={a} className="flex items-start gap-3 text-slate-200">
                  <span className="mt-0.5 text-teal">✓</span> {a}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="#reserve" variant="amber" className="text-base">Reserve your spot</Button>
            </div>
          </div>

          <div id="reserve" className="rounded-xl2 bg-white p-6 text-slate-800 shadow-glow-lg sm:p-8">
            <h2 className="text-lg font-bold text-ink">Reserve your spot</h2>
            {/* Price intentionally omitted — the public site is value-led. */}
            <p className="mb-4 mt-1 text-sm text-slate-500">04–06 Aug 2026 · 7:00–8:30 AM IST · Zoom Live · limited seats.</p>
            <LeadForm cta="Reserve your spot →" source="masterclass" formKey="masterclass" formLabel="Masterclass Registration" note="No payment yet — you’re reserving your spot. We’ll email the joining details." />
          </div>
        </Container>
      </section>
      <StatBar />
      <Section>
        <FAQ />
      </Section>
    </>
  );
}
