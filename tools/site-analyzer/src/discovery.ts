import { XMLParser } from 'fast-xml-parser';
import { config } from './config';
import { logger } from './utils/logger';
import { normalizeUrl } from './utils/normalizeUrl';

const log = logger.child({ mod: 'discovery' });

export interface RobotsRules {
  /** Disallow path prefixes that apply to our user-agent (or `*`). */
  disallow: string[];
  allow: string[];
  crawlDelayMs: number | null;
  sitemaps: string[];
  raw: string;
}

/** Fetch text with the analyzer user-agent; returns null on failure. */
async function fetchText(url: string): Promise<{ status: number; body: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': config.userAgent, accept: 'text/plain,application/xml,text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    const body = await res.text();
    return { status: res.status, body };
  } catch (err) {
    log.warn({ url, err: String(err) }, 'fetch failed');
    return null;
  }
}

/**
 * Fetch and parse robots.txt. We honour the most specific matching group:
 * our exact UA token ("SiteAnalyzer") if present, otherwise "*".
 */
export async function fetchRobots(): Promise<RobotsRules> {
  const robotsUrl = config.origin + '/robots.txt';
  const result = await fetchText(robotsUrl);
  const empty: RobotsRules = { disallow: [], allow: [], crawlDelayMs: null, sitemaps: [], raw: '' };
  if (!result || result.status >= 400) {
    log.warn({ status: result?.status }, 'no robots.txt — proceeding with built-in boundaries only');
    return empty;
  }

  const raw = result.body;
  const lines = raw.split(/\r?\n/);

  // Group directives by user-agent.
  const groups: { agents: string[]; disallow: string[]; allow: string[]; crawlDelay: number | null }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  const sitemaps: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === 'user-agent') {
      if (!lastWasAgent || !current) {
        current = { agents: [], disallow: [], allow: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) {
      current = { agents: ['*'], disallow: [], allow: [], crawlDelay: null };
      groups.push(current);
    }
    if (field === 'disallow') current.disallow.push(value);
    else if (field === 'allow') current.allow.push(value);
    else if (field === 'crawl-delay') {
      const n = Number(value);
      if (Number.isFinite(n)) current.crawlDelay = n;
    } else if (field === 'sitemap') {
      sitemaps.push(value);
    }
  }

  // Pick the group matching our UA token, else the "*" group.
  const uaToken = 'siteanalyzer';
  const match =
    groups.find((g) => g.agents.some((a) => a !== '*' && uaToken.includes(a.replace(/\*/g, '')))) ??
    groups.find((g) => g.agents.includes('*'));

  const rules: RobotsRules = {
    disallow: (match?.disallow ?? []).filter((d) => d.length > 0),
    allow: match?.allow ?? [],
    // Use the largest declared crawl-delay to stay polite (robots showed 1 & 0).
    crawlDelayMs:
      match?.crawlDelay != null && match.crawlDelay > 0 ? Math.round(match.crawlDelay * 1000) : null,
    sitemaps: sitemaps.length ? sitemaps : [config.origin + '/sitemap.xml'],
    raw,
  };
  log.info(
    { disallow: rules.disallow.length, sitemaps: rules.sitemaps.length, crawlDelayMs: rules.crawlDelayMs },
    'parsed robots.txt',
  );
  return rules;
}

/** True if `pathname` is blocked by any robots Disallow rule (Allow overrides). */
export function isDisallowedByRobots(pathname: string, rules: RobotsRules): boolean {
  const matchLen = (patterns: string[]): number => {
    let best = -1;
    for (const p of patterns) {
      // Basic wildcard support: '*' and end-anchor '$'.
      const prefix = p.replace(/\*.*$/, '');
      if (pathname.startsWith(prefix)) best = Math.max(best, prefix.length);
    }
    return best;
  };
  const dis = matchLen(rules.disallow);
  if (dis < 0) return false;
  const allow = matchLen(rules.allow);
  return dis > allow; // longer (more specific) disallow wins
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

/** Recursively fetch a sitemap (handles sitemap-index files). */
export async function fetchSitemapUrls(sitemapUrl: string, seen = new Set<string>()): Promise<SitemapUrl[]> {
  if (seen.has(sitemapUrl)) return [];
  seen.add(sitemapUrl);

  const res = await fetchText(sitemapUrl);
  if (!res || res.status >= 400) {
    log.warn({ sitemapUrl, status: res?.status }, 'sitemap unavailable');
    return [];
  }

  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  let doc: any;
  try {
    doc = parser.parse(res.body);
  } catch (err) {
    log.warn({ sitemapUrl, err: String(err) }, 'sitemap parse failed');
    return [];
  }

  const out: SitemapUrl[] = [];

  // Sitemap index → recurse.
  if (doc.sitemapindex?.sitemap) {
    const entries = toArray(doc.sitemapindex.sitemap);
    for (const e of entries) {
      if (e.loc) out.push(...(await fetchSitemapUrls(String(e.loc), seen)));
    }
    return out;
  }

  // Regular urlset.
  if (doc.urlset?.url) {
    for (const e of toArray(doc.urlset.url)) {
      if (e.loc) out.push({ loc: String(e.loc), lastmod: e.lastmod ? String(e.lastmod) : undefined });
    }
  }
  log.info({ sitemapUrl, count: out.length }, 'parsed sitemap');
  return out;
}

function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

/** Collect all same-host, normalized seed URLs from every declared sitemap. */
export async function discoverSeeds(rules: RobotsRules): Promise<{ url: string; lastmod?: string }[]> {
  const all: SitemapUrl[] = [];
  for (const sm of rules.sitemaps) all.push(...(await fetchSitemapUrls(sm)));

  const seeds = new Map<string, { url: string; lastmod?: string }>();
  for (const { loc, lastmod } of all) {
    const norm = normalizeUrl(loc);
    if (!norm) continue;
    const u = new URL(norm.normalized);
    if (u.hostname.toLowerCase() !== config.host) continue;
    if (!seeds.has(norm.normalized)) seeds.set(norm.normalized, { url: norm.normalized, lastmod });
  }
  // Always include the homepage seed.
  const home = normalizeUrl(config.seedUrl)!;
  if (!seeds.has(home.normalized)) seeds.set(home.normalized, { url: home.normalized });
  return [...seeds.values()];
}
