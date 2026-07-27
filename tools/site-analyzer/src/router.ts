import { config, hasSensitiveQuery } from './config';
import { isDisallowedByRobots, type RobotsRules } from './discovery';
import { normalizeUrl } from './utils/normalizeUrl';

export type RejectReason =
  | 'unparseable'
  | 'bad-scheme'
  | 'external-host'
  | 'robots-disallow'
  | 'boundary-prefix'
  | 'boundary-contains'
  | 'sensitive-query'
  | 'non-html-asset'
  | 'depth-exceeded';

export interface RouteDecision {
  allowed: boolean;
  normalized: string | null;
  reason?: RejectReason;
}

// Non-analysis file extensions we never enqueue as pages.
const ASSET_EXT = /\.(pdf|zip|rar|7z|gz|tar|dmg|exe|msi|apk|mp4|mp3|wav|mov|avi|webm|csv|xlsx?|docx?|pptx?)($|\?)/i;

/** Schemes we explicitly reject early (mailto, tel, javascript, data, etc.). */
export function isRejectedScheme(href: string): boolean {
  return /^(mailto:|tel:|javascript:|data:|blob:|ftp:|sms:|whatsapp:)/i.test(href.trim());
}

/**
 * Decide whether a discovered link should be crawled. Enforces, in order:
 * scheme → same-host → robots.txt → legal/safety boundaries → sensitive query
 * → asset filter → depth.
 */
export function evaluate(href: string, rules: RobotsRules, depth: number, base?: string): RouteDecision {
  if (isRejectedScheme(href)) return { allowed: false, normalized: null, reason: 'bad-scheme' };

  const norm = normalizeUrl(href, base);
  if (!norm) return { allowed: false, normalized: null, reason: 'unparseable' };

  let u: URL;
  try {
    u = new URL(norm.normalized);
  } catch {
    return { allowed: false, normalized: null, reason: 'unparseable' };
  }

  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { allowed: false, normalized: norm.normalized, reason: 'bad-scheme' };
  }

  // Same host only (no subdomains such as learn.* — those are separate apps).
  if (u.hostname.toLowerCase() !== config.host) {
    return { allowed: false, normalized: norm.normalized, reason: 'external-host' };
  }

  const path = u.pathname.toLowerCase();

  // robots.txt.
  if (config.respectRobots && isDisallowedByRobots(u.pathname, rules)) {
    return { allowed: false, normalized: norm.normalized, reason: 'robots-disallow' };
  }

  // Legal / safety boundary prefixes (aligned on a path-segment boundary).
  if (config.rejectPathPrefixes.some((p) => path === p || path.startsWith(p + '/'))) {
    return { allowed: false, normalized: norm.normalized, reason: 'boundary-prefix' };
  }
  if (config.rejectPathContains.some((c) => path.includes(c))) {
    return { allowed: false, normalized: norm.normalized, reason: 'boundary-contains' };
  }

  // Sensitive / signed query strings.
  if (hasSensitiveQuery(u)) {
    return { allowed: false, normalized: norm.normalized, reason: 'sensitive-query' };
  }

  // Non-HTML asset files.
  if (ASSET_EXT.test(u.pathname)) {
    return { allowed: false, normalized: norm.normalized, reason: 'non-html-asset' };
  }

  // Depth cap.
  if (config.maxCrawlDepth > 0 && depth > config.maxCrawlDepth) {
    return { allowed: false, normalized: norm.normalized, reason: 'depth-exceeded' };
  }

  return { allowed: true, normalized: norm.normalized };
}

/** Classify a normalized URL into a coarse page type from its path shape. */
export function classifyPageType(normalizedUrl: string): string {
  let path: string;
  try {
    path = new URL(normalizedUrl).pathname.toLowerCase();
  } catch {
    return 'unknown';
  }
  if (path === '/' || path === '') return 'home';
  const seg = path.split('/').filter(Boolean);
  const first = seg[0];
  const map: Record<string, string> = {
    stories: seg.length > 1 ? 'story' : 'stories-index',
    programs: seg.length > 1 ? 'program' : 'programs-index',
    events: seg.length > 1 ? 'event' : 'events-index',
    tools: seg.length > 1 ? 'tool' : 'tools-index',
    guides: 'guide',
    about: 'about',
    join: 'conversion',
    masterclass: 'lead-magnet',
    'niche-finder': 'tool',
    privacy: 'legal',
    terms: 'legal',
    refund: 'legal',
    press: 'content',
    books: 'content',
    handbook: 'content',
    explore: 'hub',
    affiliates: 'content',
    pulse: 'content',
  };
  return map[first ?? ''] ?? 'page';
}
