import type { CheerioAPI } from 'cheerio';
import { collapseWhitespace, safeExcerpt } from '../utils/sanitize';
import type { Heading, PageMeta } from '../schemas/page.schema';

/** Extract <head> metadata: description, OG, Twitter, JSON-LD, canonical, etc. */
export function extractMeta($: CheerioAPI): { meta: PageMeta; canonicalUrl: string | null; title: string | null } {
  const title = collapseWhitespace($('head > title').first().text()) || null;

  const metaContent = (selector: string): string | null => {
    const v = $(selector).attr('content');
    return v ? collapseWhitespace(v) : null;
  };

  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property');
    const content = $(el).attr('content');
    if (prop && content) openGraph[prop] = collapseWhitespace(content);
  });

  const twitter: Record<string, string> = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    const name = $(el).attr('name');
    const content = $(el).attr('content');
    if (name && content) twitter[name] = collapseWhitespace(content);
  });

  const jsonLd: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) jsonLd.push(...parsed);
      else jsonLd.push(parsed);
    } catch {
      // Invalid JSON-LD is flagged by the SEO extractor; skip here.
      jsonLd.push({ __invalid: true, __snippet: safeExcerpt(raw, 120) });
    }
  });

  const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || null;

  const meta: PageMeta = {
    description: metaContent('meta[name="description"]'),
    keywords: metaContent('meta[name="keywords"]'),
    robots: metaContent('meta[name="robots"]'),
    viewport: metaContent('meta[name="viewport"]'),
    charset: $('meta[charset]').attr('charset') ?? null,
    language: $('html').attr('lang') ?? null,
    openGraph,
    twitter,
    jsonLd,
  };

  return { meta, canonicalUrl, title };
}

/** Extract the H1–H6 heading hierarchy in document order. */
export function extractHeadings($: CheerioAPI): Heading[] {
  const headings: Heading[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = Number(el.tagName.replace(/[^\d]/g, ''));
    const text = collapseWhitespace($(el).text());
    if (text) headings.push({ level, text: text.slice(0, 200) });
  });
  return headings;
}

/** Best-effort breadcrumb trail from common breadcrumb markup patterns. */
export function extractBreadcrumbs($: CheerioAPI): string[] {
  const selectors = [
    '[aria-label*="breadcrumb" i] a, [aria-label*="breadcrumb" i] span',
    'nav.breadcrumb a, .breadcrumbs a, ol.breadcrumb li',
    '[itemtype*="BreadcrumbList"] [itemprop="name"]',
  ];
  for (const sel of selectors) {
    const items: string[] = [];
    $(sel).each((_, el) => {
      const t = collapseWhitespace($(el).text());
      if (t) items.push(t);
    });
    if (items.length >= 2) return items.slice(0, 10);
  }
  return [];
}
