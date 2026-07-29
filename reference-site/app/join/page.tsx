import type { Metadata } from 'next';
import { Section, SectionHeading } from '@/components/ui';
import { LeadForm } from '@/components/LeadForm';
import { stats } from '@/lib/site';

export const metadata: Metadata = { title: 'Reserve Your Spot' };

export default function JoinPage() {
  return (
    <Section>
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Reserve" title="Reserve your spot" align="left" lead="Grab your seat for the 3-day live workshop and install the CoachX framework." />
          <ul className="mt-6 space-y-4">
            {stats.map((s) => (
              <li key={s.label} className="flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-teal">{s.value}</span>
                <span className="text-sm text-slate-500">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-ink">Reserve your spot</h2>
          {/* Price intentionally omitted — the public site is value-led. */}
          <p className="mb-4 mt-1 text-sm text-slate-500">04–06 Aug 2026 · Zoom Live · limited seats.</p>
          <LeadForm cta="Reserve your spot" source="join" formKey="join" formLabel="Join Form" />
        </div>
      </div>
    </Section>
  );
}
