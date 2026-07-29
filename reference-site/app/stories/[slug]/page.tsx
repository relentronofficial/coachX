import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Section, Badge, Button } from '@/components/ui';
import { CTA } from '@/components/sections';
import { stories, img } from '@/lib/site';

export function generateStaticParams() {
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = stories.find((s) => s.slug === slug);
  return story ? { title: `${story.name} — ${story.result}` } : { title: 'Story' };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = stories.find((s) => s.slug === slug);
  if (!story) notFound();
  const more = stories.filter((s) => s.slug !== story.slug).slice(0, 3);

  return (
    <>
      <Section>
        <div className="mx-auto max-w-3xl">
          <Link href="/stories" className="text-sm font-semibold text-teal hover:underline">
            ← All stories
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <Image src={img(story.slug, 120, 120)} alt="" width={64} height={64} className="h-16 w-16 rounded-pill object-cover" />
            <div>
              <Badge>{story.role}</Badge>
              <h1 className="mt-2 text-h2">{story.name}</h1>
              <p className="text-sm text-slate-500">{story.city}</p>
            </div>
          </div>

          <div className="mt-6 rounded-card border-2 border-teal bg-white p-6 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Revenue</p>
            <p className="mt-1 text-2xl font-extrabold text-teal">{story.result}</p>
          </div>

          {/* Rendered only when the member's own words exist — an empty pair of
              quote marks reads as a testimonial nobody gave. */}
          {story.quote ? (
            <blockquote className="mt-8 border-l-4 border-slate-200 pl-5 text-lg text-slate-700">
              “{story.quote}”
            </blockquote>
          ) : null}

          {story.video && (
            /* preload="none": 4 MB is still real bandwidth, so don't fetch it until played. */
            <video controls preload="none" playsInline className="mt-8 w-full rounded-card border border-slate-200 shadow-sm">
              <source src={story.video} type="video/mp4" />
              Your browser cannot play this video.
            </video>
          )}

          <div className="mt-6 space-y-4 text-slate-600">
            <p>
              <strong className="text-ink">Placeholder story.</strong> This route is fully wired — swap in {story.name}
              ’s real journey here: where they started, what changed, and the results they achieved.
            </p>
            <p>
              Want a path like this? Start with the free{' '}
              <Link href="/tools/niche-finder" className="font-semibold text-teal hover:underline">
                Niche Finder
              </Link>{' '}
              to find your direction.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/masterclass" variant="amber">Reserve your spot</Button>
            <Button href="/tools/niche-finder" variant="secondary">Find your niche</Button>
          </div>
        </div>

        {/* More stories */}
        <div className="mx-auto mt-14 max-w-3xl">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink">More stories</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {more.map((s) => (
              <Link key={s.slug} href={`/stories/${s.slug}`} className="card card-i">
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="text-xs text-slate-500">{s.role}</p>
                <p className="mt-1 text-xs font-semibold text-teal">{s.result}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>
      <CTA />
    </>
  );
}
