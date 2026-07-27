import type { CheerioAPI } from 'cheerio';
import { config } from '../config';
import { normalizeUrl } from '../utils/normalizeUrl';
import { isRejectedScheme } from '../router';
import { collapseWhitespace } from '../utils/sanitize';
import type { PageLink } from '../schemas/page.schema';

const SOCIAL_HOSTS = [
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'youtube.com',
  'youtu.be',
  't.me',
  'telegram.me',
  'wa.me',
  'whatsapp.com',
  'pinterest.com',
  'threads.net',
  'tiktok.com',
];

const DOWNLOAD_EXT = /\.(pdf|zip|docx?|xlsx?|pptx?|csv|epub|mp3|mp4)($|\?)/i;

export interface ExtractedLinks {
  all: PageLink[];
  internal: string[];
  external: string[];
  social: string[];
  downloads: string[];
}

/** Extract, classify and normalize every anchor on the page. */
export function extractLinks($: CheerioAPI, pageUrl: string): ExtractedLinks {
  const internal = new Set<string>();
  const external = new Set<string>();
  const social = new Set<string>();
  const downloads = new Set<string>();
  const all: PageLink[] = [];

  $('a[href]').each((_, el) => {
    const $el = $(el);
    const href = ($el.attr('href') ?? '').trim();
    if (!href || href === '#' || isRejectedScheme(href)) return;

    const norm = normalizeUrl(href, pageUrl);
    const text = collapseWhitespace($el.text()) || collapseWhitespace($el.attr('aria-label') ?? '');
    const link: PageLink = {
      href,
      normalized: norm?.normalized ?? null,
      text: text.slice(0, 120),
      rel: $el.attr('rel') ?? null,
      target: $el.attr('target') ?? null,
    };
    all.push(link);

    if (!norm) return;
    let u: URL;
    try {
      u = new URL(norm.normalized);
    } catch {
      return;
    }
    const host = u.hostname.toLowerCase();
    if (DOWNLOAD_EXT.test(u.pathname)) downloads.add(norm.normalized);

    if (host === config.host) {
      internal.add(norm.normalized);
    } else {
      external.add(norm.normalized);
      if (SOCIAL_HOSTS.some((s) => host === s || host.endsWith('.' + s))) social.add(norm.normalized);
    }
  });

  return {
    all,
    internal: [...internal],
    external: [...external],
    social: [...social],
    downloads: [...downloads],
  };
}
