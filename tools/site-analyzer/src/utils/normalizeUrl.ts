import { shortHash } from './hash';

/** Tracking / campaign params stripped during normalization. */
export const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_reader',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'ref',
  'ref_src',
  '_hsenc',
  '_hsmi',
  'vero_id',
  'yclid',
]);

export interface NormalizedUrl {
  /** Canonical, deduplicated URL string. */
  normalized: string;
  /** Deterministic storage key derived from the normalized URL. */
  hash: string;
}

/**
 * Normalize a URL for queueing & de-duplication:
 *  - force https, lowercase host, drop default ports
 *  - remove fragments
 *  - strip tracking params, sort remaining params
 *  - normalize trailing slash (keep root "/", drop trailing slash elsewhere)
 *
 * Returns `null` for un-parseable input.
 */
export function normalizeUrl(input: string, base?: string): NormalizedUrl | null {
  let u: URL;
  try {
    u = base ? new URL(input, base) : new URL(input);
  } catch {
    return null;
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  // Force https and lowercase host.
  u.protocol = 'https:';
  u.hostname = u.hostname.toLowerCase();
  if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
    u.port = '';
  }
  u.port = '';
  u.hash = '';

  // Strip tracking params, keep the rest sorted for a stable canonical form.
  const kept: [string, string][] = [];
  for (const [k, v] of u.searchParams.entries()) {
    if (TRACKING_PARAMS.has(k.toLowerCase())) continue;
    kept.push([k, v]);
  }
  kept.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  u.search = '';
  for (const [k, v] of kept) u.searchParams.append(k, v);

  // Trailing slash: keep root, otherwise remove a single trailing slash.
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }

  const normalized = u.toString();
  return { normalized, hash: shortHash(normalized) };
}

/** Convenience: just the normalized string (or null). */
export function normalize(input: string, base?: string): string | null {
  return normalizeUrl(input, base)?.normalized ?? null;
}
