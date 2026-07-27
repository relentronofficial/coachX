import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Section, Button } from '@/components/ui';
import { CTA } from '@/components/sections';
import { guides } from '@/lib/site';

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find((g) => g.slug === slug);
  return guide ? { title: guide.title, description: guide.excerpt } : { title: 'Guide' };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides.find((g) => g.slug === slug);
  if (!guide) notFound();
  const related = guides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <Container className="py-12">
          <Link href="/guides" className="text-sm font-semibold text-teal hover:underline">
            ← All guides
          </Link>
          <p className="mt-4 text-xs font-semibold text-teal">{guide.minutes} min read · Guide</p>
          <h1 className="mt-2 max-w-3xl text-h1">{guide.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-500">{guide.excerpt}</p>
        </Container>
      </section>

      <Section>
        <article className="prose-cx mx-auto max-w-2xl space-y-5 text-slate-700">
          <p className="text-lg">
            <strong className="text-ink">Placeholder article.</strong> This page demonstrates a fully wired guide
            route — replace the copy below with your own content.
          </p>
          <h2 className="text-xl font-bold text-ink">Why this matters</h2>
          <p>
            A short, practical overview of “{guide.title.toLowerCase()}”. Explain the core idea in plain language and
            why it helps a coach get results faster.
          </p>
          <h2 className="text-xl font-bold text-ink">The simple approach</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Start with one clear focus rather than trying everything.</li>
            <li>Use a repeatable system you can run every week.</li>
            <li>Measure what works and double down.</li>
          </ol>
          <h2 className="text-xl font-bold text-ink">Try it yourself</h2>
          <p>
            Not sure where to begin? Use the free{' '}
            <Link href="/tools/niche-finder" className="font-semibold text-teal hover:underline">
              Niche Finder
            </Link>{' '}
            to pin down a direction, then model the numbers with the{' '}
            <Link href="/tools/revenue-calculator" className="font-semibold text-teal hover:underline">
              Revenue Calculator
            </Link>
            .
          </p>
          <div className="not-prose rounded-card border border-slate-200 bg-slate-50 p-5">
            <Button href="/tools/niche-finder" variant="primary">
              Open the Niche Finder →
            </Button>
          </div>
        </article>

        {/* Related */}
        <div className="mx-auto mt-14 max-w-2xl">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink">Keep reading</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="card transition-transform hover:-translate-y-1">
                <p className="text-xs font-semibold text-teal">{g.minutes} min</p>
                <p className="mt-1 text-sm font-bold text-ink">{g.title}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>
      <CTA />
    </>
  );
}
