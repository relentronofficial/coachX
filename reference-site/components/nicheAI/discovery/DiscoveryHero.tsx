'use client';

/**
 * Discovery hero — the browse-mode entry point.
 *
 * The counts are read from the live taxonomy rather than hard-coded, so they
 * cannot drift from the library the way a written-in "10,000+" would.
 */

import { CATEGORY_COUNT, TOPIC_COUNT } from '@/lib/nicheAI/topicEngine';

const round = (n: number) => `${(Math.floor(n / 1000) * 1000).toLocaleString()}+`;

export function DiscoveryHero({ children }: { children?: React.ReactNode }) {
  const stats = [
    { value: round(TOPIC_COUNT), label: 'Niches' },
    { value: 'Smart', label: 'AI Search' },
    { value: `${CATEGORY_COUNT}`, label: 'Categories' },
    { value: 'Personalized', label: 'Recommendations' },
  ];

  return (
    <section className="cx-fade-up text-center" data-testid="nf-discovery-hero">
      <p className="cx-chip !px-4 !py-1.5 !text-[11px]">✨ AI-powered niche discovery</p>
      <h1 className="cx-brandtext mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
        Discover Your Perfect Niche from {round(TOPIC_COUNT)} Opportunities
      </h1>
      <p className="cx-muted mx-auto mt-4 max-w-2xl text-sm sm:text-base">
        Explore more than {round(TOPIC_COUNT)} carefully organized business niches with AI-powered search and smart
        recommendations.
      </p>

      <dl className="mx-auto mt-7 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="cx-glass px-3 py-3.5">
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <span className="block text-lg font-extrabold" style={{ color: 'var(--cx-gold)' }}>
                {s.value}
              </span>
              <span className="cx-muted block text-[11px] font-semibold">{s.label}</span>
            </dd>
          </div>
        ))}
      </dl>

      {children ? <div className="mt-7">{children}</div> : null}
    </section>
  );
}
