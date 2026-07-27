import type { Page } from '../schemas/page.schema';
import type { ComponentInstance, ComponentSummary, StyleSnapshot } from '../schemas/component.schema';
import type { BrokenLink } from '../schemas/site.schema';
import { config } from '../config';
import { RateLimiter } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

const log = logger.child({ mod: 'feature' });

/** Roll per-page component instances up into a site-wide component inventory. */
export function summarizeComponents(instances: ComponentInstance[]): ComponentSummary[] {
  const byName = new Map<string, ComponentInstance[]>();
  for (const inst of instances) {
    const arr = byName.get(inst.name) ?? [];
    arr.push(inst);
    byName.set(inst.name, arr);
  }

  const summaries: ComponentSummary[] = [];
  for (const [name, group] of byName) {
    const pages = [...new Set(group.map((g) => g.page))];
    const variants = [...new Set(group.map((g) => g.variant).filter((v): v is string => !!v))];
    const sampleText = [...new Set(group.map((g) => g.text).filter((t): t is string => !!t))].slice(0, 8);
    // Representative style = the first instance's style (most common component).
    const representativeStyle: Partial<StyleSnapshot> | null = group.find((g) => g.style)?.style ?? null;
    summaries.push({ name, count: group.length, pages, variants, sampleText, representativeStyle });
  }
  return summaries.sort((a, b) => b.count - a.count);
}

/** Aggregate SEO findings across the whole site (incl. cross-page duplicates). */
export function summarizeSeo(pages: Page[]): Record<string, unknown> {
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  const issueCounts: Record<string, number> = {};

  for (const p of pages) {
    if (p.title) {
      const arr = titles.get(p.title) ?? [];
      arr.push(p.normalizedUrl);
      titles.set(p.title, arr);
    }
    if (p.meta.description) {
      const arr = descriptions.get(p.meta.description) ?? [];
      arr.push(p.normalizedUrl);
      descriptions.set(p.meta.description, arr);
    }
    for (const issue of p.seoIssues) issueCounts[issue.code] = (issueCounts[issue.code] ?? 0) + 1;
  }

  const duplicateTitles = [...titles.entries()].filter(([, urls]) => urls.length > 1).map(([title, urls]) => ({ title, urls }));
  const duplicateDescriptions = [...descriptions.entries()]
    .filter(([, urls]) => urls.length > 1)
    .map(([description, urls]) => ({ description, urls }));

  return {
    pagesAudited: pages.length,
    issueCounts,
    duplicateTitles,
    duplicateDescriptions,
    pagesMissingTitle: pages.filter((p) => !p.title).map((p) => p.normalizedUrl),
    pagesMissingDescription: pages.filter((p) => !p.meta.description).map((p) => p.normalizedUrl),
    pagesNoindex: pages.filter((p) => /noindex/i.test(p.meta.robots ?? '')).map((p) => p.normalizedUrl),
  };
}

/**
 * Rate-limited internal broken-link check. Uses HEAD, falling back to GET when
 * a server rejects HEAD. External links are recorded but only sampled.
 */
export async function checkBrokenLinks(pages: Page[]): Promise<BrokenLink[]> {
  if (!config.checkBrokenLinks) return [];

  const limiter = new RateLimiter(Math.max(400, config.minDelayMs / 3), config.maxJitterMs / 3);
  const results: BrokenLink[] = [];
  const checked = new Map<string, { status: number; chain: string[] }>();

  // Build unique (source, target) internal edges.
  const edges: { source: string; target: string }[] = [];
  const seenEdge = new Set<string>();
  for (const p of pages) {
    for (const target of p.internalLinks) {
      const key = p.normalizedUrl + '|' + target;
      if (seenEdge.has(key)) continue;
      seenEdge.add(key);
      edges.push({ source: p.normalizedUrl, target });
    }
  }

  async function probe(url: string): Promise<{ status: number; chain: string[] }> {
    if (checked.has(url)) return checked.get(url)!;
    await limiter.acquire();
    const chain: string[] = [];
    try {
      let res = await fetch(url, { method: 'HEAD', headers: { 'user-agent': config.userAgent }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
      // Follow up to 5 manual redirects to record the chain.
      let hops = 0;
      let current = url;
      while (res.status >= 300 && res.status < 400 && hops < 5) {
        const loc = res.headers.get('location');
        if (!loc) break;
        const next = new URL(loc, current).toString();
        chain.push(next);
        current = next;
        await limiter.acquire();
        res = await fetch(next, { method: 'HEAD', headers: { 'user-agent': config.userAgent }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
        hops++;
      }
      // Some servers 405 on HEAD — retry with GET.
      if (res.status === 405 || res.status === 501) {
        await limiter.acquire();
        res = await fetch(current, { method: 'GET', headers: { 'user-agent': config.userAgent }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
      }
      const out = { status: res.status, chain };
      checked.set(url, out);
      return out;
    } catch (err) {
      log.warn({ url, err: String(err) }, 'link probe failed');
      const out = { status: 0, chain };
      checked.set(url, out);
      return out;
    }
  }

  for (const edge of edges) {
    const { status, chain } = await probe(edge.target);
    results.push({
      source: edge.source,
      target: edge.target,
      status,
      redirectChain: chain,
      broken: status === 0 || status >= 400,
      type: 'internal',
    });
  }

  return results;
}
