import type { MetadataRoute } from 'next';
import { brand, events, guides, stories, programs as staticPrograms } from '@/lib/site';
import { engineTools } from '@/lib/tools/configs';
import { listPublishedPrograms } from '@/lib/cms/store';

/**
 * Sitemap, built from the same sources the pages render from — the CMS program
 * catalogue plus the static content collections — so it cannot drift from what
 * actually exists. Every URL is absolute against `brand.url`.
 *
 * Deliberately excludes anything gated or personal: /admin, /profile, the auth
 * routes and /book-strategy-call (which only makes sense with query context).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = brand.url.replace(/\/$/, '');
  const url = (path: string) => `${base}${path}`;
  const now = new Date();

  const entry = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']) => ({
    url: url(path),
    lastModified: now,
    changeFrequency,
    priority,
  });

  // Programs come from the CMS when it has been seeded, matching ProgramCards.
  const cmsPrograms = await listPublishedPrograms().catch(() => []);
  const programs = cmsPrograms.length ? cmsPrograms : staticPrograms;

  return [
    entry('/', 1, 'weekly'),
    entry('/masterclass', 0.9, 'weekly'),
    entry('/programs', 0.9, 'weekly'),
    entry('/tools', 0.8, 'weekly'),
    entry('/niche-finder', 0.8, 'weekly'),
    entry('/about', 0.6, 'monthly'),
    entry('/guides', 0.6, 'weekly'),
    entry('/stories', 0.6, 'weekly'),
    entry('/events', 0.6, 'weekly'),
    entry('/join', 0.5, 'monthly'),

    ...programs.map((p) => entry(`/programs/${p.slug}`, 0.7, 'monthly')),
    ...engineTools.map((t) => entry(`/tools/${t.slug}`, 0.7, 'monthly')),
    entry('/tools/revenue-calculator', 0.7, 'monthly'),
    ...guides.map((g) => entry(`/guides/${g.slug}`, 0.5, 'monthly')),
    ...stories.map((s) => entry(`/stories/${s.slug}`, 0.5, 'monthly')),
    ...events.map((e) => entry(`/events#${e.slug}`, 0.4, 'monthly')),
  ];
}
