import Link from 'next/link';
import type { Metadata } from 'next';
import { Section, SectionHeading, Badge } from '@/components/ui';
import { CTA } from '@/components/sections';
import { Stagger } from '@/components/motion/Reveal';
import { tools, bonusTools, type ToolMeta } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'Free Tools',
  description: 'Seven free coaching tools — from the Niche Finder to persona codexes, scorecards and challenges.',
};

function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link href={tool.href} className="block h-full" data-testid={`tool-card-${tool.slug}`}>
      <div className="card card-i group flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-card bg-blush text-2xl transition-transform duration-300 group-hover:scale-110">
            {tool.icon}
          </span>
          <span className="rounded-pill bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{tool.category}</span>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">{tool.name}</h3>
        <p className="mt-2 flex-1 text-sm text-slate-500">{tool.description}</p>
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-teal">
          Open tool <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="Free tools"
          title="Coaching tools that do the thinking with you"
          lead="Seven free, interactive tools — from finding your niche to scoring your skills and building momentum."
        />

        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" itemClassName="h-full" testId="tools-grid">
          {tools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </Stagger>

        {bonusTools.length > 0 ? (
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Also useful</h2>
              <span className="rule-fade flex-1" />
            </div>
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" itemClassName="h-full">
              {bonusTools.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </Stagger>
          </div>
        ) : null}

        <p className="mt-8 text-center text-sm text-slate-400">
          <Badge>Original</Badge>{' '}
          <span className="ml-2">
            All tools are original CoachX implementations. No login, no payment — your answers stay on your device.
          </span>
        </p>
      </Section>
      <CTA />
    </>
  );
}
