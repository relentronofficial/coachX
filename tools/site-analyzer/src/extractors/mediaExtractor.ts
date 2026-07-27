import type { CheerioAPI } from 'cheerio';
import { normalizeUrl } from '../utils/normalizeUrl';
import { collapseWhitespace } from '../utils/sanitize';
import { shortHash } from '../utils/hash';
import type { Media } from '../schemas/page.schema';

function mimeFromUrl(url: string | null): string | null {
  if (!url) return null;
  const m = url.split('?')[0].match(/\.([a-z0-9]+)$/i);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
  };
  return map[ext] ?? null;
}

function videoProvider(src: string): string | null {
  if (/youtube\.com|youtu\.be/.test(src)) return 'youtube';
  if (/vimeo\.com/.test(src)) return 'vimeo';
  if (/wistia\./.test(src)) return 'wistia';
  if (/loom\.com/.test(src)) return 'loom';
  return null;
}

function num(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

/** Nearest section heading above an element, used to attribute media to a section. */
function nearestSection($: CheerioAPI, el: any): string | null {
  const section = $(el).closest('section, article, div[class*="section" i]');
  const heading = section.find('h1, h2, h3').first();
  const t = collapseWhitespace(heading.text());
  return t ? t.slice(0, 80) : null;
}

/**
 * Inventory visible media (images, videos, iframes, notable SVGs). Stores
 * METADATA & URL references only — never downloads source files in bulk.
 */
export function extractMedia($: CheerioAPI, pageUrl: string): Media[] {
  const media: Media[] = [];
  const seen = new Set<string>();

  $('img').each((_, el) => {
    const $el = $(el);
    const rawSrc = $el.attr('src') ?? $el.attr('data-src') ?? $el.attr('data-lazy-src') ?? null;
    const resolved = rawSrc ? (normalizeUrl(rawSrc, pageUrl)?.normalized ?? rawSrc) : null;
    const w = num($el.attr('width'));
    const h = num($el.attr('height'));
    const key = 'img:' + (resolved ?? Math.random());
    if (seen.has(key)) return;
    seen.add(key);
    media.push({
      kind: 'image',
      src: rawSrc,
      resolvedSrc: resolved,
      alt: $el.attr('alt') ?? null,
      title: $el.attr('title') ?? null,
      width: w,
      height: h,
      aspectRatio: w && h ? Number((w / h).toFixed(3)) : null,
      mime: mimeFromUrl(resolved),
      lazy: ($el.attr('loading') ?? '') === 'lazy' || $el.attr('data-src') !== undefined,
      section: nearestSection($, el),
      provider: null,
      hash: resolved ? shortHash(resolved) : null,
    });
  });

  $('video').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') ?? $el.find('source').first().attr('src') ?? null;
    const resolved = src ? (normalizeUrl(src, pageUrl)?.normalized ?? src) : null;
    media.push({
      kind: 'video',
      src,
      resolvedSrc: resolved,
      alt: $el.attr('aria-label') ?? null,
      title: $el.attr('title') ?? null,
      width: num($el.attr('width')),
      height: num($el.attr('height')),
      aspectRatio: null,
      mime: mimeFromUrl(resolved),
      lazy: false,
      section: nearestSection($, el),
      provider: 'native',
      hash: resolved ? shortHash(resolved) : null,
    });
  });

  $('iframe[src]').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') ?? '';
    const provider = videoProvider(src);
    if (!provider && !/embed|player|form|maps/.test(src)) return; // skip trackers/ads
    media.push({
      kind: 'iframe',
      src,
      resolvedSrc: src,
      alt: $el.attr('title') ?? null,
      title: $el.attr('title') ?? null,
      width: num($el.attr('width')),
      height: num($el.attr('height')),
      aspectRatio: null,
      mime: null,
      lazy: ($el.attr('loading') ?? '') === 'lazy',
      section: nearestSection($, el),
      provider: provider ?? 'embed',
      hash: shortHash(src),
    });
  });

  return media;
}
