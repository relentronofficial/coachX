import type { CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { config } from '../config';
import { normalizeUrl } from '../utils/normalizeUrl';
import { collapseWhitespace } from '../utils/sanitize';
import { isRejectedScheme } from '../router';
import type { PageLink } from '../schemas/page.schema';

function linksWithin($: CheerioAPI, container: Cheerio<AnyNode>): PageLink[] {
  const seen = new Set<string>();
  const out: PageLink[] = [];
  container.find('a[href]').each((_, el) => {
    const $el = $(el);
    const href = ($el.attr('href') ?? '').trim();
    if (!href || href === '#' || isRejectedScheme(href)) return;
    const text = collapseWhitespace($el.text()) || collapseWhitespace($el.attr('aria-label') ?? '');
    if (!text) return;
    const norm = normalizeUrl(href, config.origin);
    const key = text + '|' + href;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      href,
      normalized: norm?.normalized ?? null,
      text: text.slice(0, 80),
      rel: $el.attr('rel') ?? null,
      target: $el.attr('target') ?? null,
    });
  });
  return out;
}

/** Extract the primary/header navigation links (robust to non-semantic markup). */
export function extractMainNav($: CheerioAPI): PageLink[] {
  const candidates = [
    'header nav',
    'nav[aria-label*="main" i]',
    'nav[aria-label*="primary" i]',
    '[role="navigation"]',
    'header',
    '[role="banner"]',
    '[class*="navbar" i]',
    '[class*="header" i][class*="nav" i]',
    '[class*="site-header" i]',
    '[class*="header" i]',
    '[class*="menu" i]',
    'nav',
  ];
  for (const sel of candidates) {
    const container = $(sel).first();
    if (container.length) {
      const links = linksWithin($, container);
      if (links.length >= 2) return links.slice(0, 40);
    }
  }
  return [];
}

/** Extract footer navigation links (robust to non-semantic markup). */
export function extractFooterNav($: CheerioAPI): PageLink[] {
  const candidates = ['footer', '[role="contentinfo"]', '[class*="footer" i]', '[id*="footer" i]'];
  for (const sel of candidates) {
    const container = $(sel).first();
    if (container.length) {
      const links = linksWithin($, container);
      if (links.length >= 1) return links.slice(0, 80);
    }
  }
  return [];
}
