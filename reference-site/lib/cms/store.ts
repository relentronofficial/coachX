import 'server-only';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { brand, programs as defaultPrograms } from '@/lib/site';
import { INR_SYMBOL } from '@/lib/currency';
import type { HomepageContent, SiteSettings, CmsProgram } from './types';

/**
 * CMS content store. Page/section content and catalog items live here so the
 * admin can edit them without touching source. Defaults are SEEDED from the
 * existing site data on first read, so the public site always renders even
 * before anything is edited ("no hardcoding" with a safe fallback).
 */

interface CmsData {
  docs: Record<string, unknown>;
  collections: Record<string, unknown[]>;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'cms.json');

let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function readData(): Promise<CmsData> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, 'utf8')) as Partial<CmsData>;
    return { docs: raw.docs ?? {}, collections: raw.collections ?? {} };
  } catch {
    return { docs: {}, collections: {} };
  }
}
async function writeData(data: CmsData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ---- Generic doc/collection primitives -----------------------------------

export async function getDoc<T>(key: string, fallback: T): Promise<T> {
  const data = await readData();
  return (data.docs[key] as T) ?? fallback;
}
export async function setDoc<T>(key: string, value: T): Promise<T> {
  return withLock(async () => {
    const data = await readData();
    data.docs[key] = value;
    await writeData(data);
    return value;
  });
}
export async function listItems<T>(collection: string, seed: T[]): Promise<T[]> {
  const data = await readData();
  if (!data.collections[collection]) return seed;
  return data.collections[collection] as T[];
}
async function saveItems<T>(collection: string, items: T[]): Promise<void> {
  const data = await readData();
  data.collections[collection] = items as unknown[];
  await writeData(data);
}

// ---- Seed defaults --------------------------------------------------------

export const DEFAULT_HOMEPAGE: HomepageContent = {
  hero: {
    badge: 'The growth platform for coaches',
    title: 'Where your expertise becomes a business that grows',
    subtitle:
      'Clarity, tools and a proven system in one place — from finding your niche to building predictable revenue, without the guesswork.',
    primaryCta: { label: 'Find your niche', href: '/tools/niche-finder' },
    secondaryCta: { label: 'Explore programs', href: '/programs' },
    trust: 'Trusted by 10,000+ coaches · 4.9/5 rated',
  },
  seo: {
    title: `${brand.name} — ${brand.tagline}`,
    description: 'Clarity, tools and a proven system to grow your coaching business.',
  },
};

export const DEFAULT_SETTINGS: SiteSettings = {
  site: { name: brand.name, short: brand.short, tagline: brand.tagline, email: brand.email },
  seo: {
    defaultTitle: `${brand.name} — ${brand.tagline}`,
    defaultDescription: 'The growth platform for coaches.',
    ogImage: '/brand/coachx-logo.png',
    robots: 'index,follow',
  },
  theme: { primary: '#105030', accent: '#d0a030', ink: '#0a2e1e' },
};

const seedPrograms = (): CmsProgram[] =>
  defaultPrograms.map((p, i) => ({
    id: p.slug,
    slug: p.slug,
    name: p.name,
    price: p.price,
    cadence: p.cadence,
    summary: p.summary,
    perks: p.perks,
    featured: !!p.featured,
    published: true,
    order: i,
  }));

// ---- Typed accessors ------------------------------------------------------

export const getHomepage = () => getDoc<HomepageContent>('homepage', DEFAULT_HOMEPAGE);
export const setHomepage = (v: HomepageContent) => setDoc('homepage', v);

export const getSettings = () => getDoc<SiteSettings>('settings', DEFAULT_SETTINGS);
export const setSettings = (v: SiteSettings) => setDoc('settings', v);

export const listPrograms = () => listItems<CmsProgram>('programs', seedPrograms());
export async function listPublishedPrograms(): Promise<CmsProgram[]> {
  return (await listPrograms()).filter((p) => p.published).sort((a, b) => a.order - b.order);
}

export async function upsertProgram(input: Partial<CmsProgram>): Promise<CmsProgram> {
  return withLock(async () => {
    const items = await listPrograms();
    const now = items;
    if (input.id) {
      const idx = now.findIndex((p) => p.id === input.id);
      if (idx >= 0) {
        now[idx] = { ...now[idx], ...input } as CmsProgram;
        await saveItems('programs', now);
        return now[idx];
      }
    }
    const created: CmsProgram = {
      id: randomUUID(),
      slug: (input.slug || input.name || 'program').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      name: input.name ?? 'New program',
      price: input.price ?? `${INR_SYMBOL}0`,
      cadence: input.cadence ?? '',
      summary: input.summary ?? '',
      perks: input.perks ?? [],
      featured: input.featured ?? false,
      published: input.published ?? false,
      order: now.length,
    };
    now.push(created);
    await saveItems('programs', now);
    return created;
  });
}

export async function deleteProgram(id: string): Promise<boolean> {
  return withLock(async () => {
    const items = await listPrograms();
    const next = items.filter((p) => p.id !== id);
    if (next.length === items.length) return false;
    await saveItems('programs', next);
    return true;
  });
}
